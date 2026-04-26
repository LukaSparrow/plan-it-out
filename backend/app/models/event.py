"""
Plik z fizyczną mapą Tabeli `events`.
Rozszerzony o: kategorię, datę zakończenia, koordynaty, status oraz relacje
do uczestników, listy zadań i wydatków.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.participant import Participant
    from app.models.checklist import ChecklistItem
    from app.models.expense import Expense


class EventCategory(str, Enum):
    TRIP = "trip"
    PARTY = "party"
    MEETUP = "meetup"
    WORK = "work"
    SPORT = "sport"
    OTHER = "other"


class EventStatus(str, Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    PAST = "past"
    CANCELLED = "cancelled"


# Pola wspólne - dziedziczone przez schematy Pydantic, żeby nie powtarzać definicji
class EventBase(SQLModel):
    title: str
    description: Optional[str] = None
    date: datetime
    end_date: Optional[datetime] = None
    location: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    category: EventCategory = Field(default=EventCategory.OTHER)
    status: EventStatus = Field(default=EventStatus.UPCOMING)


class Event(EventBase, table=True):
    __tablename__ = "events"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Organizator (właściciel) - 1:N z User
    owner: "User" = Relationship(back_populates="events")

    # Uczestnicy - N:M przez tabelę participants (z dodatkowymi polami: rola, RSVP)
    participants: List["Participant"] = Relationship(
        back_populates="event",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    # Lista zadań - 1:N
    checklist_items: List["ChecklistItem"] = Relationship(
        back_populates="event",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    # Wydatki - 1:N
    expenses: List["Expense"] = Relationship(
        back_populates="event",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
