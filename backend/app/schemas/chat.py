"""
Schematy Pydantic dla wiadomości czatu.
ChatMessageCreate — to co frontend wysyła w ciele POST /events/{id}/chat.
ChatMessageResponse — pełna wiadomość z autorem zwracana w odpowiedzi i przez WebSocket.
"""
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserRead


class ChatMessageBase(BaseModel):
    content: str
    event_id: UUID


class ChatMessageCreate(ChatMessageBase):
    """Ciało requesta — treść i ID wydarzenia."""
    pass


class ChatMessageResponse(ChatMessageBase):
    """Odpowiedź z pełnymi danymi wiadomości, w tym autorem."""
    id: UUID
    user_id: UUID
    created_at: datetime
    user: UserRead  # Zagnieżdżony autor wiadomości

    model_config = ConfigDict(from_attributes=True)
