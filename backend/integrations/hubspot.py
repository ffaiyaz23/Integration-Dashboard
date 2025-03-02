# hubspot.py

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
import secrets
import base64
import hashlib
import json
import asyncio
import httpx
from typing import List
from pydantic import BaseModel

# Import your Redis client functions
from redis_client import get_value_redis, delete_key_redis, add_key_value_redis



# OAuth Configuration Variables

redirect_uri = 'http://localhost:8000/integrations/hubspot/oauth2callback'
token_url = 'https://api.hubapi.com/oauth/v1/token'

# Define the required scopes
scope = "crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.read crm.schemas.contacts.read oauth"

async def authorize_hubspot(user_id, org_id):
    # Step 1: Generate a random state
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode('utf-8')).decode('utf-8')

    # Step 2: Generate code verifier and challenge
    code_verifier = secrets.token_urlsafe(32)
    m = hashlib.sha256()
    m.update(code_verifier.encode('utf-8'))
    code_challenge = base64.urlsafe_b64encode(m.digest()).decode('utf-8').replace('=', '')

    # Step 3: Build the authorization URL
    authorization_url = f'https://app.hubspot.com/oauth/authorize?client_id=f3d88cf8-bc1d-4200-84ac-9f7e3e413cba&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fintegrations%2Fhubspot%2Foauth2callback&state={encoded_state}&code_challenge={code_challenge}&code_challenge_method=S256&scope={scope }'

    # Step 4: Store state and code verifier in Redis
    await add_key_value_redis(f'hubspot_state:{org_id}:{user_id}', json.dumps(state_data), expire=600)
    await add_key_value_redis(f'hubspot_verifier:{org_id}:{user_id}', code_verifier, expire=600)

    # Return the authorization URL to redirect the user
    return authorization_url

async def oauth2callback_hubspot(request: Request):
    # Step 1: Check for errors in the callback
    if request.query_params.get('error'):
        error_message = request.query_params.get('error_description')
        raise HTTPException(status_code=400, detail=error_message)

    # Step 2: Extract the authorization code and state from the query params
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    state_data = json.loads(base64.urlsafe_b64decode(encoded_state).decode('utf-8'))

    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')

    # Step 3: Retrieve saved state and code_verifier from Redis
    saved_state, code_verifier = await asyncio.gather(
        get_value_redis(f'hubspot_state:{org_id}:{user_id}'),
        get_value_redis(f'hubspot_verifier:{org_id}:{user_id}')
    )

    # Step 4: Check if the state matches
    if not saved_state or original_state != json.loads(saved_state).get('state'):
        raise HTTPException(status_code=400, detail='State does not match.')

    # Step 5: Make the POST request to exchange the authorization code for an access token
    client_secret = 'd8097064-97dc-415f-87fc-f86960d46a93'

    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_url,
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': client_id,
                'client_secret': client_secret,
                'code_verifier': code_verifier.decode('utf-8')
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

    # Step 6: Handle response and save credentials
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail='Failed to get HubSpot credentials.')

    credentials = response.json()

    # Save the HubSpot credentials in Redis (for 600 seconds)
    await add_key_value_redis(f'hubspot_credentials:{org_id}:{user_id}', json.dumps(credentials), expire=600)

    # Step 7: Close the window by returning HTML
    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)

async def get_hubspot_credentials(user_id, org_id):
    # Retrieve credentials from Redis
    credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
    
    # If no credentials are found, raise an exception
    if not credentials:
        raise HTTPException(status_code=400, detail='No HubSpot credentials found.')

    # Parse the credentials (they are stored as JSON in Redis)
    credentials = json.loads(credentials)
    
    # Delete the credentials from Redis to maintain security
    await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')

    # Return the credentials
    return credentials


async def create_integration_item_metadata_object(response_json):
    # Initialize an empty list to store integration items
    integration_items = []

    # Iterate through the response data, assuming 'results' contains the list of items
    for item in response_json.get('results', []):
        integration_item = {
            "id": item.get("id"),
            "name": item.get("properties", {}).get("name"),  # Adjust to the actual field in the API response
            "email": item.get("properties", {}).get("email"),  # Example field
            "phone": item.get("properties", {}).get("phone"),  # Example field
            "company": item.get("properties", {}).get("company"),  # Example field
            "created_at": item.get("createdAt"),  # Adjust based on HubSpot response
            "updated_at": item.get("updatedAt"),  # Adjust based on HubSpot response
        }
        integration_items.append(integration_item)

    # Return the list of integration items
    return integration_items


async def get_items_hubspot(credentials, limit=100, after=None):
    
    access_token = credentials.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token provided.")

    hubspot_api_url = "https://api.hubapi.com/crm/v3/objects/contacts"
    params = {
        "limit": limit
    }
    if after:
        params["after"] = after

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(hubspot_api_url, headers=headers, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to fetch data from HubSpot: {response.json().get('message')}"
        )

    response_json = response.json()
    integration_items = await create_integration_item_metadata_object(response_json)

    # Extract the 'after' cursor for the next page
    next_page_cursor = response_json.get("paging", {}).get("next", {}).get("after", None)

    return integration_items, next_page_cursor