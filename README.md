# Integration Dashboard

## Overview

This project is a multi-integration dashboard that enables users to connect with popular third-party services—Notion, Airtable, and HubSpot—using OAuth 2.0 authentication. Once connected, users can load and view data from these integrations through a clean, responsive React-based interface. The backend, built with FastAPI, manages authentication flows, API communication, and temporary token storage using Redis.

## Tech Stack

### Backend
- **Python**: Core programming language for backend development.
- **FastAPI**: High-performance API framework for building RESTful services.
- **OAuth 2.0**: Standard protocol for authorization used to connect with Notion, Airtable, and HubSpot.
- **httpx**: Asynchronous HTTP client for making API requests.
- **AsyncIO**: For handling asynchronous operations.
- **Redis**: In-memory data store used for temporary storage of tokens, state, and credentials.

### Frontend
- **React**: JavaScript library for building user interfaces.
- **Material UI (MUI)**: Component library for building responsive and modern UIs.
- **Axios**: Promise-based HTTP client for the browser to communicate with the backend.
- **React Flow**: (Optional) Library for visualizing integration flows and data relationships.
- **JavaScript**: Primary language for client-side logic and interactions.

## How It Works

1. **Authentication**: 
   - Users select an integration (Notion, Airtable, or HubSpot) and initiate the OAuth flow.
   - The backend handles the OAuth authorization code exchange and securely stores temporary credentials in Redis.

2. **Data Loading**:
   - Once authenticated, the application retrieves data from the selected integration.
   - Users can load, clear, and paginate through the data using the React frontend.

3. **User Interface**:
   - A form collects user and organization information.
   - An Autocomplete component allows users to choose an integration type.
   - Loaded data is displayed in a table format for easy review.

## Getting Started

### Prerequisites
- **Python 3.8+** and **Node.js** installed on your machine.
- Redis server running locally or accessible via network.
- OAuth client credentials configured for Notion, Airtable, and HubSpot.

### Backend Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
