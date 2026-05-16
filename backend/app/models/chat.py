"""
Model wiadomości czatu przypisanej do wydarzenia.
Historia czatu jest persistowana w bazie — nowi uczestnicy widzą wcześniejsze wiadomości.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="events.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relacje wsteczne — ładowane lazy przez SQLAlchemy
    event: Optional["Event"] = Relationship(back_populates="chat_messages")
    user: Optional["User"] = Relationship(back_populates="chat_messages")