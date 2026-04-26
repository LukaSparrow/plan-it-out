"""
Definicja użytkownika zapisanego w bazie.
Rozszerzona o relacje: uczestnictwa w wydarzeniach, przypisane zadania,
opłacone wydatki, awatar.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime, timezone
from enum import Enum

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.participant import Participant
    from app.models.checklist import ChecklistItem
    from app.models.expense import Expense, ExpenseSplit


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    avatar_url: Optional[str] = None
    role: UserRole = Field(default=UserRole.USER)


class User(UserBase, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Wydarzenia, których jestem organizatorem
    events: List["Event"] = Relationship(back_populates="owner")

    # Wydarzenia, do których jestem zaproszony/dołączyłem (przez tabelę Participant)
    participations: List["Participant"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    # Zadania, które stworzyłem
    created_checklist_items: List["ChecklistItem"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={"foreign_keys": "[ChecklistItem.created_by_id]"},
    )

    # Zadania, które są mi przypisane
    assigned_checklist_items: List["ChecklistItem"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={"foreign_keys": "[ChecklistItem.assigned_to_id]"},
    )

    # Wydatki, które opłaciłem
    paid_expenses: List["Expense"] = Relationship(back_populates="paid_by")

    # Wydatki, w których uczestniczę (split)
    expense_splits: List["ExpenseSplit"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
