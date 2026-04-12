from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.models.event import Event
from app.schemas.event import EventCreate, EventRead

router = APIRouter()

@router.get("/", response_model=List[EventRead])
def read_events(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    events = session.exec(
        select(Event).where(Event.owner_id == current_user.id).offset(skip).limit(limit)
    ).all()
    return events

@router.post("/", response_model=EventRead)
def create_event(
    *, session: SessionDep, current_user: User = Depends(get_current_user), event_in: EventCreate
) -> Any:
    event = Event.model_validate(event_in, update={"owner_id": current_user.id})
    session.add(event)
    session.commit()
    session.refresh(event)
    return event
