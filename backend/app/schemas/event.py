from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.event import EventBase

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: UUID
    owner_id: UUID
