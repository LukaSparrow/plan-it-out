from fastapi import APIRouter
from app.api.v1.endpoints import auth, events, checklist, expenses, friends, google_auth, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])

# Checklist i expenses używają tego samego prefiksu /events bo ich ścieżki to
# /events/{event_id}/checklist i /events/{event_id}/expenses - frontend już tak woła.
api_router.include_router(checklist.router, prefix="/events", tags=["checklist"])
api_router.include_router(expenses.router, prefix="/events", tags=["expenses"])
api_router.include_router(friends.router, prefix="/friends", tags=["friends"])
