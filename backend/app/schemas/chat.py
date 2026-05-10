from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserRead

class ChatMessageBase(BaseModel):
    content: str
    event_id: UUID

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    user: UserRead

    model_config = ConfigDict(from_attributes=True)
