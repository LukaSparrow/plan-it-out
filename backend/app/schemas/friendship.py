"""
Schematy Pydantic dla zaproszeń do znajomych.
FriendInviteRequest — ciało POST /friends/invite.
FriendRequestRead — przychodzące zaproszenie widoczne na liście próśb.
"""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserPublic


class FriendInviteRequest(BaseModel):
    email: str  # Adres e-mail osoby, którą zapraszamy


class FriendRequestRead(BaseModel):
    id: UUID
    requester: UserPublic  # Pełne dane osoby, która wysłała zaproszenie
    status: str
    created_at: datetime
