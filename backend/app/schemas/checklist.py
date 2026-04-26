"""
Schematy Pydantic dla listy zadań.
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserPublic


class ChecklistItemCreate(BaseModel):
    label: str
    assigned_to: Optional[UUID] = None  # ID uzytkownika (opcjonalne)


class ChecklistItemRead(BaseModel):
    id: UUID
    event_id: UUID
    label: str
    is_done: bool
    created_at: datetime
    created_by: UserPublic
    assigned_to: Optional[UserPublic] = None

    model_config = {"from_attributes": True}
