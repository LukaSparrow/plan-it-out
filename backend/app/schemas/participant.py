"""
Schematy Pydantic dla uczestnika - kształt zwracany w response wydarzenia.
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.participant import ParticipantRole, RsvpStatus
from app.schemas.user import UserPublic


class ParticipantRead(BaseModel):
    id: UUID
    role: ParticipantRole
    rsvp: RsvpStatus
    joined_at: datetime
    user: UserPublic

    model_config = {"from_attributes": True}


class InviteCreate(BaseModel):
    email: str  # E-mail osoby, którą zapraszamy
