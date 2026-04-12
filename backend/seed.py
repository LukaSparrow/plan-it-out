import os
import sys
from datetime import datetime, timezone
from sqlmodel import Session, select

# Adjust path to import from app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine
from app.models.user import User, UserRole
from app.models.event import Event
from app.core.security import get_password_hash

def seed_data():
    with Session(engine) as session:
        # Check if user "Jan Kowalski" exists
        email = "jan@example.com"
        user = session.exec(select(User).where(User.email == email)).first()
        
        if not user:
            print("Creating user 'Jan Kowalski'...")
            user = User(
                email=email,
                full_name="Jan Kowalski",
                hashed_password=get_password_hash("password"), # Matches frontend dev login
                role=UserRole.USER,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"User created with ID: {user.id}")
        else:
            print(f"User '{email}' already exists.")

        # Check if events exist for this user
        events = session.exec(select(Event).where(Event.owner_id == user.id)).all()
        if not events:
            print("Creating mock events...")
            event1 = Event(
                title="Wyjazd na narty – Zakopane",
                description="Długo wyczekiwany wypad w góry! Śpiwory, ciepłe kurtki i dobra muzyka.",
                date=datetime.strptime("2026-11-14T08:00:00Z", "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc),
                location="Zakopane, Polska",
                owner_id=user.id
            )
            event2 = Event(
                title="Domówka u Anny",
                description="Świętujemy urodziny Anny! Wbijajcie na 20:00.",
                date=datetime.strptime("2026-05-20T20:00:00Z", "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc),
                location="Warszawa, Centrum",
                owner_id=user.id
            )
            session.add(event1)
            session.add(event2)
            session.commit()
            print("Events created.")
        else:
            print(f"User already has {len(events)} events.")

if __name__ == "__main__":
    print("Starting database seed...")
    try:
        seed_data()
        print("Seed complete.")
    except Exception as e:
        print(f"Error seeding database: {e}")
