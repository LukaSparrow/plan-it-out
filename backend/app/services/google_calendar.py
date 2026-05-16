"""
Serwis do tworzenia wydarzeń w Google Calendar użytkownika.
Synchronizacja jest "best-effort" — błędy są logowane, ale nie przerywają
głównego flow aplikacji (wywoływane jako BackgroundTask).
"""
import httpx
from app.core.config import settings

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


async def _get_access_token(refresh_token: str) -> str:
    """Wymienia refresh_token na krótkotrwały access_token potrzebny do API Kalendarza."""
    async with httpx.AsyncClient() as client:
        r = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        })
        r.raise_for_status()
        return r.json()["access_token"]


async def create_calendar_event(
    refresh_token: str,
    title: str,
    start_iso: str,
    end_iso: str,
    location: str | None,
    description: str | None,
) -> None:
    """
    Tworzy wydarzenie w Google Calendar zalogowanego użytkownika.
    Całość owinięta w try/except — błąd Google nie powinien walić głównego requesta.
    """
    try:
        access_token = await _get_access_token(refresh_token)
        event_body = {
            "summary": title,
            "location": location or "",
            "description": description or "",
            # Strefa Warsaw — serwer trzyma daty naiwne (bez TZ), frontend pokazuje czas lokalny
            "start": {"dateTime": start_iso, "timeZone": "Europe/Warsaw"},
            "end": {"dateTime": end_iso, "timeZone": "Europe/Warsaw"},
        }
        async with httpx.AsyncClient() as client:
            r = await client.post(
                GOOGLE_CALENDAR_EVENTS_URL,
                json=event_body,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if r.status_code >= 400:
                print(f"[google_calendar] API error {r.status_code}: {r.text}")
    except Exception as e:
        print(f"[google_calendar] sync failed: {e}")
