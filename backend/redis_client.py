# redis_cleint.py
import os
import redis.asyncio as redis
from kombu.utils.url import safequote

redis_host = safequote(os.environ.get('REDIS_HOST', 'localhost'))
redis_client = redis.Redis(host=redis_host, port=6379, db=0)


async def add_key_value_redis(key, value, expire=None):

    result = await redis_client.set(key, value)
    # Debug what we got from the set command
    # print(f"DEBUG: Redis SET result for {key}: {result}")

    # Immediately read back the data to confirm it's saved
    saved_value = await redis_client.get(key)
    # print(f"DEBUG: Redis GET for {key}: {saved_value}")

    if expire:
        await redis_client.expire(key, expire)

    # await redis_client.set("code_test_key", "HelloFromCode")
    # val = await redis_client.get("code_test_key")
    # print("DEBUG: code_test_key ->", val)

async def get_value_redis(key):
    return await redis_client.get(key)

async def delete_key_redis(key):
    await redis_client.delete(key)
