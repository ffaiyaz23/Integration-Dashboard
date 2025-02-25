# models.py
from pydantic import BaseModel
from typing import Optional

class IntegrationItem(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    created_at: Optional[str] = None
    # Add other relevant fields as needed
