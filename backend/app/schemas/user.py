from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole
from app.models.user import UserBase

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    
class UserRead(UserBase):
    id: UUID
    created_at: datetime
