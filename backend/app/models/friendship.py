"""
Model znajomości między dwoma użytkownikami.
Para (requester_id, receiver_id) jest unikalna — nie można wysłać duplikatu zaproszenia.
Relacja jest kierunkowa w bazie, ale logicznie traktowana jako dwustronna po akceptacji.
"""
from sqlmodel import SQLModel, Field, UniqueConstraint
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum


class FriendshipStatus(str, Enum):
    PENDING = "pending"    # Zaproszenie wysłane, czeka na odpowiedź
    ACCEPTED = "accepted"  # Znajomość zaakceptowana
    DECLINED = "declined"  # Zaproszenie odrzucone


class Friendship(SQLModel, table=True):
    __tablename__ = "friendships"
    # Unikalny constraint zapobiega duplikatom — jeden kierunek zaproszenia per para
    __table_args__ = (
        UniqueConstraint("requester_id", "receiver_id", name="uq_friendship_pair"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    requester_id: UUID = Field(foreign_key="users.id", index=True)  # Kto wysłał zaproszenie
    receiver_id: UUID = Field(foreign_key="users.id", index=True)   # Kto otrzymał zaproszenie
    status: FriendshipStatus = Field(default=FriendshipStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
