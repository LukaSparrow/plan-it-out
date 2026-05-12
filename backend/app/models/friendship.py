from sqlmodel import SQLModel, Field, UniqueConstraint
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum


class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class Friendship(SQLModel, table=True):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "receiver_id", name="uq_friendship_pair"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    requester_id: UUID = Field(foreign_key="users.id", index=True)
    receiver_id: UUID = Field(foreign_key="users.id", index=True)
    status: FriendshipStatus = Field(default=FriendshipStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
