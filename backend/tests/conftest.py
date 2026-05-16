"""
Konfiguracja pytest: silnik SQLite in-memory, klient testowy FastAPI,
fixtures użytkownika i nagłówków autoryzacji.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.api.deps import get_session
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.event import Event
from app.models.participant import Participant, ParticipantRole, RsvpStatus

# SQLite in-memory — każdy test ma własną czystą bazę
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def _get_test_session():
    with Session(_engine) as session:
        yield session


@pytest.fixture(autouse=True)
def _reset_db():
    """Tworzy schemat przed każdym testem i usuwa go po."""
    SQLModel.metadata.create_all(_engine)
    yield
    SQLModel.metadata.drop_all(_engine)


@pytest.fixture
def db():
    """Sesja bazodanowa na bezpośrednie operacje w testach."""
    with Session(_engine) as session:
        yield session


@pytest.fixture
def client():
    """TestClient FastAPI z podmienioną zależnością DB na SQLite in-memory."""
    app.dependency_overrides[get_session] = _get_test_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Zarejestrowany użytkownik do testów (hasło: 'password123')."""
    user = User(
        email="jan@example.com",
        full_name="Jan Kowalski",
        hashed_password=get_password_hash("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def second_user(db):
    """Drugi użytkownik do testów wieloosobowych."""
    user = User(
        email="anna@example.com",
        full_name="Anna Nowak",
        hashed_password=get_password_hash("password123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Nagłówki HTTP z tokenem JWT dla test_user."""
    token = create_access_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_auth_headers(second_user):
    """Nagłówki HTTP z tokenem JWT dla second_user."""
    token = create_access_token(str(second_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_event(db, test_user):
    """Wydarzenie należące do test_user, z organizatorem jako uczestnikiem."""
    from datetime import datetime, timezone, timedelta
    event = Event(
        title="Testowe wydarzenie",
        date=datetime.now(timezone.utc) + timedelta(days=7),
        location="Warszawa",
        owner_id=test_user.id,
    )
    db.add(event)
    db.flush()
    # Organizator jako uczestnik
    participant = Participant(
        event_id=event.id,
        user_id=test_user.id,
        role=ParticipantRole.ORGANIZER,
        rsvp=RsvpStatus.ACCEPTED,
    )
    db.add(participant)
    db.commit()
    db.refresh(event)
    return event
