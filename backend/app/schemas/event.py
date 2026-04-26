"""
Schematy Pydantic dla wydarzenia.
EventRead - lista (lekka, bez relacji), EventReadFull - szczegóły (z uczestnikami,
checklistą i wydatkami zagnieżdżonymi).
"""
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.event import EventBase, EventCategory, EventStatus
from app.schemas.user import UserPublic
from app.schemas.participant import ParticipantRead


class EventCreate(EventBase):
    """POST /events - frontend wysyła dokładnie pola z EventBase."""
    pass


class EventUpdate(BaseModel):
    """PUT /events/{id} - wszystkie pola opcjonalne (partial update)."""
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    category: Optional[EventCategory] = None
    status: Optional[EventStatus] = None


class EventRead(EventBase):
    """Lekka wersja do listy - bez kosztownych relacji."""
    id: UUID
    owner_id: UUID
    created_at: datetime


class EventReadFull(EventRead):
    """Pełna wersja dla GET /events/{id} - razem z relacjami.

    UWAGA: checklist_items i expenses są tu osobne, ale frontend i tak ładuje je
    przez dedykowane endpointy (/checklist, /expenses). Zwracamy je dla wygody,
    żeby strona szczegółów mogła zrobić jeden round-trip.
    """
    organizer: UserPublic
    participants: List[ParticipantRead] = []

    model_config = {"from_attributes": True}
