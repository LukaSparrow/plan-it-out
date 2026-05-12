from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserPublic


class FriendInviteRequest(BaseModel):
    email: str


class FriendRequestRead(BaseModel):
    id: UUID
    requester: UserPublic
    status: str
    created_at: datetime
