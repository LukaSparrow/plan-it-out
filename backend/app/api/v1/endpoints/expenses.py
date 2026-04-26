"""
Endpointy wydatków + rozliczeń (balansów).
Algorytm liczenia balansów żyje w services/splitter.py.
"""
from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.models.event import Event
from app.models.participant import Participant
from app.models.expense import Expense, ExpenseSplit
from app.schemas.expense import ExpenseCreate, ExpenseRead, Balance
from app.schemas.user import UserPublic
from app.services.splitter import calculate_balances

router = APIRouter()


def _check_event_access(session: SessionDep, event_id: UUID, user: User) -> Event:
    """Patrz: events.py - dokładnie ta sama reguła."""
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


def _expense_to_read(exp: Expense) -> ExpenseRead:
    """Helper - mapuje Expense + splits na ExpenseRead z płaską listą UUID."""
    return ExpenseRead(
        id=exp.id,
        event_id=exp.event_id,
        description=exp.description,
        amount=exp.amount,
        currency=exp.currency,
        created_at=exp.created_at,
        paid_by=UserPublic.model_validate(exp.paid_by),
        split_among=[s.user_id for s in exp.splits],
    )


@router.get("/{event_id}/expenses", response_model=List[ExpenseRead])
def list_expenses(
    event_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    _check_event_access(session, event_id, current_user)
    expenses = session.exec(
        select(Expense)
        .where(Expense.event_id == event_id)
        .order_by(Expense.created_at.desc())
    ).all()
    return [_expense_to_read(e) for e in expenses]


@router.post(
    "/{event_id}/expenses",
    response_model=ExpenseRead,
    status_code=status.HTTP_201_CREATED,
)
def add_expense(
    event_id: UUID,
    expense_in: ExpenseCreate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    _check_event_access(session, event_id, current_user)

    # Walidacja - wszyscy "split_among" muszą istnieć i powinni być uczestnikami eventu
    # (sprawdzenie istnienia w bazie wystarczy MVP - rygorystyczność można dorzucić później)
    found_users = session.exec(
        select(User).where(User.id.in_(expense_in.split_among))
    ).all()
    if len(found_users) != len(set(expense_in.split_among)):
        raise HTTPException(
            status_code=400,
            detail="Some users in split_among don't exist",
        )

    expense = Expense(
        event_id=event_id,
        description=expense_in.description,
        amount=expense_in.amount,
        currency=expense_in.currency,
        paid_by_id=current_user.id,
    )
    session.add(expense)
    session.flush()  # Potrzebujemy ID dla splitów

    for user_id in set(expense_in.split_among):  # set() na wypadek duplikatów
        session.add(ExpenseSplit(expense_id=expense.id, user_id=user_id))

    session.commit()
    session.refresh(expense)
    return _expense_to_read(expense)


@router.get("/{event_id}/expenses/balances", response_model=List[Balance])
def get_balances(
    event_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Zwraca minimalną listę transakcji "X przelewa Y", żeby wszyscy wyszli na zero.
    Działa dla wszystkich wydatków danego eventu razem (nie per-currency).
    """
    _check_event_access(session, event_id, current_user)

    expenses = session.exec(
        select(Expense).where(Expense.event_id == event_id)
    ).all()

    raw = calculate_balances(expenses)  # [{from_user_id, to_user_id, amount}, ...]

    if not raw:
        return []

    # Pobieramy userów hurtem - jeden roundtrip do bazy zamiast N+1
    user_ids = {t["from_user_id"] for t in raw} | {t["to_user_id"] for t in raw}
    users = session.exec(select(User).where(User.id.in_(user_ids))).all()
    users_by_id = {u.id: UserPublic.model_validate(u) for u in users}

    return [
        Balance(
            **{
                "from": users_by_id[t["from_user_id"]],
                "to": users_by_id[t["to_user_id"]],
                "amount": t["amount"],
            }
        )
        for t in raw
    ]
