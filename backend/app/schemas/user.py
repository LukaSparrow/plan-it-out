"""
Schematy Pydantic dla użytkownika - kształt JSON wchodzącego/wychodzącego z API.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserBase


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserRead(UserBase):
    id: UUID
    created_at: datetime


# Zubożona wersja - używamy w nested response (np. lista uczestników wydarzenia),
# żeby nie ładować pełnego usera z rolą i datą stworzenia za każdym razem.
class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}
