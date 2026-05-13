"""
Google OAuth2 — logowanie przez Google.
Przepływ: /auth/google → Google consent → /auth/google/callback → JWT → frontend /auth/callback
"""
from urllib.parse import urlencode
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from sqlmodel import select

from app.api.deps import SessionDep, get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _callback_uri() -> str:
    return f"{settings.BACKEND_URL}/auth/google/callback"


@router.get("/google")
def google_login() -> RedirectResponse:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": _callback_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(
    code: str,
    session: SessionDep,
) -> RedirectResponse:
    error_url = f"{settings.FRONTEND_URL}/auth/login?error=google_failed"

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": _callback_uri(),
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            return RedirectResponse(error_url)

        access_token = token_res.json().get("access_token")
        if not access_token:
            return RedirectResponse(error_url)

        userinfo_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_res.status_code != 200:
            return RedirectResponse(error_url)

        google_user = userinfo_res.json()

    email = google_user.get("email")
    if not email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/auth/login?error=no_email")

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        user = User(
            email=email,
            full_name=google_user.get("name") or email.split("@")[0],
            avatar_url=google_user.get("picture"),
            hashed_password=None,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    elif google_user.get("picture") and not user.avatar_url:
        user.avatar_url = google_user.get("picture")
        session.add(user)
        session.commit()

    jwt_token = create_access_token(subject=str(user.id))
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}")


GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"


def _calendar_callback_uri() -> str:
    return f"{settings.BACKEND_URL}/auth/google/calendar/callback"


@router.get("/google/calendar")
def connect_google_calendar(token: str) -> RedirectResponse:
    """Initiates Google OAuth to get calendar.events scope + refresh token."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": _calendar_callback_uri(),
        "response_type": "code",
        "scope": GOOGLE_CALENDAR_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": token,
    }
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/calendar/callback")
async def google_calendar_callback(
    code: str,
    state: str,
    session: SessionDep,
) -> RedirectResponse:
    """Exchanges authorization code for refresh token and stores it on the user."""
    error_url = f"{settings.FRONTEND_URL}/dashboard/settings?calendar=error"

    try:
        payload = jwt.decode(state, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = UUID(payload.get("sub"))
    except (JWTError, ValueError):
        return RedirectResponse(error_url)

    user = session.get(User, user_id)
    if not user:
        return RedirectResponse(error_url)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": _calendar_callback_uri(),
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            return RedirectResponse(error_url)
        token_data = token_res.json()

    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        return RedirectResponse(error_url)

    user.google_refresh_token = refresh_token
    session.add(user)
    session.commit()

    return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard/settings?calendar=connected")


@router.delete("/google/calendar", status_code=204)
def disconnect_google_calendar(
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> None:
    """Disconnects Google Calendar: clears refresh token and disables sync."""
    current_user.google_refresh_token = None
    current_user.google_calendar_sync = False
    session.add(current_user)
    session.commit()
