"""
Lista zadań przypisana do wydarzenia.
Każde zadanie ma autora (created_by) i opcjonalnie osobę odpowiedzialną (assigned_to).
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.user import User


class ChecklistItem(SQLModel, table=True):
    __tablename__ = "checklist_items"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="events.id", index=True)
    label: str
    is_done: bool = Field(default=False)

    created_by_id: UUID = Field(foreign_key="users.id")
    assigned_to_id: Optional[UUID] = Field(default=None, foreign_key="users.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)

    event: "Event" = Relationship(back_populates="checklist_items")

    # Dwie relacje do User - dlatego potrzebne jawne foreign_keys
    created_by: "User" = Relationship(
        back_populates="created_checklist_items",
        sa_relationship_kwargs={"foreign_keys": "[ChecklistItem.created_by_id]"},
    )
    assigned_to: Optional["User"] = Relationship(
        back_populates="assigned_checklist_items",
        sa_relationship_kwargs={"foreign_keys": "[ChecklistItem.assigned_to_id]"},
    )
