"""
Endpointy listy zadań dla wydarzenia.
Każdy uczestnik (i organizator) może dodawać/odznaczać/usuwać zadania.
"""
from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.participant import Participant
from app.models.checklist import ChecklistItem
from app.schemas.checklist import ChecklistItemCreate, ChecklistItemRead

router = APIRouter()


def _check_event_access(session: SessionDep, event_id: UUID, user: User) -> Event:
    """Helper - czy event istnieje i czy user ma do niego dostęp (owner lub uczestnik)."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.owner_id == user.id:
        return event
    is_participant = session.exec(
        select(Participant).where(
            Participant.event_id == event_id,
            Participant.user_id == user.id,
        )
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="No access to this event")
    return event


@router.get("/{event_id}/checklist", response_model=List[ChecklistItemRead])
def list_checklist(
    event_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    _check_event_access(session, event_id, current_user)
    items = session.exec(
        select(ChecklistItem)
        .where(ChecklistItem.event_id == event_id)
        .order_by(ChecklistItem.created_at)
    ).all()
    return items


@router.post(
    "/{event_id}/checklist",
    response_model=ChecklistItemRead,
    status_code=status.HTTP_201_CREATED,
)
def add_checklist_item(
    event_id: UUID,
    item_in: ChecklistItemCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    _check_event_access(session, event_id, current_user)

    # Jeśli ktoś jest przypisany - sprawdź czy w ogóle uczestniczy w wydarzeniu
    if item_in.assigned_to:
        assigned_user = session.get(User, item_in.assigned_to)
        if not assigned_user:
            raise HTTPException(status_code=400, detail="Assigned user not found")

    item = ChecklistItem(
        event_id=event_id,
        label=item_in.label,
        assigned_to_id=item_in.assigned_to,
        created_by_id=current_user.id,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.patch(
    "/{event_id}/checklist/{item_id}/toggle",
    response_model=ChecklistItemRead,
)
def toggle_checklist_item(
    event_id: UUID,
    item_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    _check_event_access(session, event_id, current_user)

    item = session.get(ChecklistItem, item_id)
    if not item or item.event_id != event_id:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    item.is_done = not item.is_done
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete(
    "/{event_id}/checklist/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_checklist_item(
    event_id: UUID,
    item_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> None:
    _check_event_access(session, event_id, current_user)

    item = session.get(ChecklistItem, item_id)
    if not item or item.event_id != event_id:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    session.delete(item)
    session.commit()
