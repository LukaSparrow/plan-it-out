"""
To jest faktyczna definicja użytkownika zapisanego w Bazie Danych (Neon / PostgreSQL).
Czyli: kolumny w bazie to pola tej klasy.
Używamy SQLModel żeby połączyć Pythona i wiersze w SQL-u.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"

# "Baza" do współdzielenia pół - np. mail jest indeksowany i tylko ten model trafia 
# do response, a my nie chcemy podawać na zewnątrz ukrytego hasła! 
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str
    role: UserRole = Field(default=UserRole.USER)

# Stąd SQL domyśla się, by z tego robić tabelę `table=True`
class User(UserBase, table=True):
    __tablename__ = "users"
    
    # Automatyczne uuidy jak id użytkownika
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    hashed_password: str # Nigdy nie trzymamy hasła, zawsze taki ciąg znaków
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # "Jeden z wielu" związek - czyli do tego usera wrzucamy wszystko co w bazie ma ten uuid w obiekcie Event
    events: List["Event"] = Relationship(back_populates="owner")
