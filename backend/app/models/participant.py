"""
Tabela uczestnictwa - łączy użytkownika z wydarzeniem.
To "bogata" tabela N:M, bo trzyma dodatkowe pola (rola, status RSVP, czas dołączenia),
których nie da się trzymać w czystej zależności wiele-do-wielu.
"""
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.event import Event


class ParticipantRole(str, Enum):
    ORGANIZER = "organizer"
    MEMBER = "member"


class RsvpStatus(str, Enum):
    ACCEPTED = "accepted"
    DECLINED = "declined"
    PENDING = "pending"


class Participant(SQLModel, table=True):
    __tablename__ = "participants"
    # Para (event_id, user_id) musi być unikalna - jedna osoba = jedno uczestnictwo per event
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_participant_event_user"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="events.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    role: ParticipantRole = Field(default=ParticipantRole.MEMBER)
    rsvp: RsvpStatus = Field(default=RsvpStatus.PENDING)
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    event: "Event" = Relationship(back_populates="participants")
    user: "User" = Relationship(back_populates="participations")
