"""
Endpointy do zarządzania znajomościami.
Zaproszenie po e-mailu, lista przychodzących próśb, akceptacja/odrzucenie, lista znajomych.
"""
from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, or_, and_

from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.schemas.user import UserPublic
from app.schemas.friendship import FriendInviteRequest, FriendRequestRead

router = APIRouter()


@router.get("/", response_model=List[UserPublic])
def get_friends(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Lista zaakceptowanych znajomych."""
    friendships = session.exec(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.status == FriendshipStatus.ACCEPTED),
                and_(Friendship.receiver_id == current_user.id, Friendship.status == FriendshipStatus.ACCEPTED),
            )
        )
    ).all()

    friend_ids = [
        f.receiver_id if f.requester_id == current_user.id else f.requester_id
        for f in friendships
    ]
    friends = [session.get(User, fid) for fid in friend_ids]
    return [UserPublic.model_validate(f) for f in friends if f]


@router.get("/requests", response_model=List[FriendRequestRead])
def get_incoming_requests(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Przychodzące oczekujące zaproszenia do znajomych."""
    requests = session.exec(
        select(Friendship).where(
            Friendship.receiver_id == current_user.id,
            Friendship.status == FriendshipStatus.PENDING,
        )
    ).all()

    result = []
    for req in requests:
        requester = session.get(User, req.requester_id)
        if requester:
            result.append(FriendRequestRead(
                id=req.id,
                requester=UserPublic.model_validate(requester),
                status=req.status,
                created_at=req.created_at,
            ))
    return result


@router.post("/invite", response_model=FriendRequestRead, status_code=status.HTTP_201_CREATED)
async def send_friend_invite(
    invite_in: FriendInviteRequest,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Wysyła zaproszenie do znajomych po adresie e-mail."""
    if invite_in.email.lower() == current_user.email.lower():
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    target = session.exec(select(User).where(User.email == invite_in.email)).first()
    if not target:
        raise HTTPException(status_code=404, detail="No user with this email")

    existing = session.exec(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.receiver_id == target.id),
                and_(Friendship.requester_id == target.id, Friendship.receiver_id == current_user.id),
            )
        )
    ).first()
    if existing:
        if existing.status == FriendshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Already friends")
        raise HTTPException(status_code=400, detail="Invite already sent or pending")

    friendship = Friendship(requester_id=current_user.id, receiver_id=target.id)
    session.add(friendship)
    session.commit()
    session.refresh(friendship)

    from app.websockets.manager import manager
    await manager.send_personal_message({
        "type": "friend_invite_received",
        "requester_name": current_user.full_name,
        "requester_id": str(current_user.id),
    }, target.id)

    return FriendRequestRead(
        id=friendship.id,
        requester=UserPublic.model_validate(current_user),
        status=friendship.status,
        created_at=friendship.created_at,
    )


@router.post("/requests/{request_id}/accept", response_model=FriendRequestRead)
def accept_friend_request(
    request_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    req = session.get(Friendship, request_id)
    if not req or req.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != FriendshipStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    req.status = FriendshipStatus.ACCEPTED
    session.add(req)
    session.commit()
    session.refresh(req)

    requester = session.get(User, req.requester_id)
    return FriendRequestRead(
        id=req.id,
        requester=UserPublic.model_validate(requester),
        status=req.status,
        created_at=req.created_at,
    )


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    friend_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> None:
    """Usuwa znajomość (w obu kierunkach)."""
    friendship = session.exec(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.receiver_id == friend_id, Friendship.status == FriendshipStatus.ACCEPTED),
                and_(Friendship.requester_id == friend_id, Friendship.receiver_id == current_user.id, Friendship.status == FriendshipStatus.ACCEPTED),
            )
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    session.delete(friendship)
    session.commit()


@router.post("/requests/{request_id}/decline", response_model=FriendRequestRead)
def decline_friend_request(
    request_id: UUID,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    req = session.get(Friendship, request_id)
    if not req or req.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != FriendshipStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request already processed")

    req.status = FriendshipStatus.DECLINED
    session.add(req)
    session.commit()
    session.refresh(req)

    requester = session.get(User, req.requester_id)
    return FriendRequestRead(
        id=req.id,
        requester=UserPublic.model_validate(requester),
        status=req.status,
        created_at=req.created_at,
    )
