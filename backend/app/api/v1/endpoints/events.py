"""
Endpointy do obsługi wydarzeń.
Dostęp: organizator widzi wszystko, uczestnicy widzą eventy do których zostali zaproszeni.
"""
from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, or_

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.participant import Participant, ParticipantRole, RsvpStatus
from app.models.chat import ChatMessage
from app.schemas.event import EventCreate, EventUpdate, EventRead, EventReadFull
from app.schemas.participant import InviteCreate, ParticipantRead
from app.schemas.chat import ChatMessageResponse, ChatMessageCreate

router = APIRouter()


# ─── Authorization helpers ─────────────────────────────────────────────────────
def _get_event_or_404(session: SessionDep, event_id: UUID) -> Event:
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _check_can_view(session: SessionDep, event: Event, user: User) -> None:
    """Czy user może oglądać event - musi być ownerem albo uczestnikiem."""
    if event.owner_id == user.id:
        return
    is_participant = session.exec(
        select(Participant).where(
            Participant.event_id == event.id,
            Participant.user_id == user.id,
        )
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="You don't have access to this event")


def _check_can_edit(event: Event, user: User) -> None:
    """Modyfikować/usuwać event może tylko organizator."""
    if event.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can modify this event")


# ─── List ────────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[EventRead])
def read_events(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Lista eventów: te których jestem ownerem ORAZ te do których jestem zaproszony."""
    # IDs eventów, w których uczestniczę (poza tym że jestem ownerem)
    participating_ids = session.exec(
        select(Participant.event_id).where(Participant.user_id == current_user.id)
    ).all()

    statement = (
        select(Event)
        .where(
            or_(
                Event.owner_id == current_user.id,
                Event.id.in_(participating_ids) if participating_ids else False,
            )
        )
        .offset(skip)
        .limit(limit)
        .order_by(Event.date.desc())
    )
    return session.exec(statement).all()


# ─── Create ──────────────────────────────────────────────────────────────────
@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    *,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    event_in: EventCreate,
) -> Any:
    """Tworzy event - automatycznie dodaje ownera jako Participanta z rolą ORGANIZER."""
    event = Event.model_validate(event_in, update={"owner_id": current_user.id})
    session.add(event)
    session.flush()  # Dostajemy ID przed commitem, żeby utworzyć Participanta

    organizer_participant = Participant(
        event_id=event.id,
        user_id=current_user.id,
        role=ParticipantRole.ORGANIZER,
        rsvp=RsvpStatus.ACCEPTED,
    )
    session.add(organizer_participant)
    session.commit()
    session.refresh(event)
    return event


# ─── Get one ─────────────────────────────────────────────────────────────────
@router.get("/{event_id}", response_model=EventReadFull)
def read_event(
    event_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    event = _get_event_or_404(session, event_id)
    _check_can_view(session, event, current_user)

    # Ręcznie składamy odpowiedź z ownerem zaszytym jako "organizer" (frontend tego oczekuje)
    return EventReadFull(
        id=event.id,
        title=event.title,
        description=event.description,
        date=event.date,
        end_date=event.end_date,
        location=event.location,
        location_lat=event.location_lat,
        location_lng=event.location_lng,
        category=event.category,
        status=event.status,
        owner_id=event.owner_id,
        created_at=event.created_at,
        organizer=event.owner,
        participants=[ParticipantRead.model_validate(p) for p in event.participants],
    )


# ─── Update ──────────────────────────────────────────────────────────────────
@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: UUID,
    event_in: EventUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    event = _get_event_or_404(session, event_id)
    _check_can_edit(event, current_user)

    # Aktualizujemy tylko podane pola (partial update)
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    session.add(event)
    session.commit()
    session.refresh(event)
    return event


# ─── Delete ──────────────────────────────────────────────────────────────────
@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> None:
    event = _get_event_or_404(session, event_id)
    _check_can_edit(event, current_user)

    # cascade=all,delete-orphan na relacjach zajmie się czyszczeniem
    session.delete(event)
    session.commit()


# ─── Invite ──────────────────────────────────────────────────────────────────
@router.post(
    "/{event_id}/invite",
    response_model=ParticipantRead,
    status_code=status.HTTP_201_CREATED,
)
def invite_to_event(
    event_id: UUID,
    invite_in: InviteCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Zaprasza użytkownika po e-mailu. Organizator dodaje go do Participantów z RSVP=PENDING."""
    event = _get_event_or_404(session, event_id)
    _check_can_edit(event, current_user)

    # Czy taki user istnieje?
    invited_user = session.exec(
        select(User).where(User.email == invite_in.email)
    ).first()
    if not invited_user:
        raise HTTPException(
            status_code=404,
            detail="User with this email is not registered",
        )

    # Czy juz nie jest dodany?
    existing = session.exec(
        select(Participant).where(
            Participant.event_id == event_id,
            Participant.user_id == invited_user.id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This user is already a participant",
        )

    participant = Participant(
        event_id=event_id,
        user_id=invited_user.id,
        role=ParticipantRole.MEMBER,
        rsvp=RsvpStatus.PENDING,
    )
    session.add(participant)
    session.commit()
    session.refresh(participant)
    return participant

# ─── Chat ────────────────────────────────────────────────────────────────────
@router.get(
    "/{event_id}/chat",
    response_model=List[ChatMessageResponse],
)
def get_chat_history(
    event_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """Pobiera historię czatu dla danego wydarzenia."""
    event = _get_event_or_404(session, event_id)
    _check_can_view(session, event, current_user)

    statement = (
        select(ChatMessage)
        .where(ChatMessage.event_id == event_id)
        # Sortowanie po najstarszych (chronologicznie) lub najnowszych i odwrócenie
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    # Pobieramy historię czatu z bazy danych
    messages = list(session.exec(statement).all())
    messages.reverse()  # frontend oczekuje chronologicznie (od najstarszej na górze)
    return messages

@router.post(
    "/{event_id}/chat",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_chat_message(
    event_id: UUID,
    message_in: ChatMessageCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Wysyła nową wiadomość na czacie (hybrydowe WebSockets)."""
    event = _get_event_or_404(session, event_id)
    _check_can_view(session, event, current_user)

    # Zapisujemy wiadomość przez REST API, żeby uniknąć problemów z sesją bazy w WebSocketach
    new_message = ChatMessage(
        event_id=event_id,
        user_id=current_user.id,
        content=message_in.content
    )
    session.add(new_message)
    session.commit()
    session.refresh(new_message)
    
    db_user = session.get(User, current_user.id)
    new_message.user = db_user
    
    new_message_response = ChatMessageResponse.model_validate(new_message)

    # Przygotuj powiadomienie na WebSockety
    message_dict = {
        "type": "new_chat_message",
        "event_title": event.title, # <-- Nazwa wydarzenia (żeby UI wiedziało gdzie pokazać dymek)
        "message": new_message_response.model_dump(mode='json')
    }

    # Szukamy wszystkich uczestników wydarzenia, żeby wysłać im powiadomienie
    participants = session.exec(
        select(Participant.user_id).where(Participant.event_id == event_id)
    ).all()
    user_ids_to_notify = [p_id for p_id in participants]
    if event.owner_id not in user_ids_to_notify:
        user_ids_to_notify.append(event.owner_id)

    # Wysłanie przez manager
    from app.websockets.manager import manager
    await manager.broadcast_to_users(user_ids_to_notify, message_dict)

    return new_message_response
