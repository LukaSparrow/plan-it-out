"""
Wydatki dla wydarzenia.

Expense to pojedynczy zarejestrowany koszt (np. "Pizza - 200 zł, zapłaciła Ania").
ExpenseSplit to relacja N:M - wskazuje, między kogo dany wydatek jest dzielony.
Algorytm Splittera (services/splitter.py) używa tego do liczenia bilansów.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User


class Expense(SQLModel, table=True):
    __tablename__ = "expenses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="events.id", index=True)

    description: str
    amount: float            # Kwota wydatku
    currency: str = Field(default="PLN", max_length=3)

    paid_by_id: UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    event: "Event" = Relationship(back_populates="expenses")
    paid_by: "User" = Relationship(back_populates="paid_expenses")

    # Lista uczestników, na których wydatek jest rozłożony (z ilością "udziałów")
    splits: List["ExpenseSplit"] = Relationship(
        back_populates="expense",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ExpenseSplit(SQLModel, table=True):
    """
    Pojedynczy "kawałek" wydatku przypadający na konkretnego usera.
    Kwoty per user nie trzymamy - liczymy w Splitterze (równy podział = amount / len(splits)).
    Można w przyszłości dodać pole `share` jeśli ktoś chce nierówny podział.
    """
    __tablename__ = "expense_splits"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    expense_id: UUID = Field(foreign_key="expenses.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)

    expense: "Expense" = Relationship(back_populates="splits")
    user: "User" = Relationship(back_populates="expense_splits")
