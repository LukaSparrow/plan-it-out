from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

class EventBase(SQLModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str

class Event(EventBase, table=True):
    __tablename__ = "events"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="users.id")
    
    owner: "User" = Relationship(back_populates="events")
