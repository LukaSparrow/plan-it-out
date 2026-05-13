from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import SessionDep, get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserPreferencesUpdate

router = APIRouter()


@router.patch("/me/preferences", response_model=UserRead)
def update_preferences(
    prefs: UserPreferencesUpdate,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Any:
    if prefs.google_calendar_sync and not current_user.google_refresh_token:
        raise HTTPException(status_code=400, detail="Google Calendar not connected")
    current_user.google_calendar_sync = prefs.google_calendar_sync
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    user_read = UserRead.model_validate(current_user)
    user_read.google_connected = bool(current_user.google_refresh_token)
    user_read.google_calendar_sync = current_user.google_calendar_sync
    return user_read
