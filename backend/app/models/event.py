"""
Plik z fizyczną mapą Tabeli `events`.
Wyjdzie z tego tabela SQL gdzie np. tytuł, opis to kolumny.
Klukiem jest owner_id, mówiące KTO jest autorem tego eventu.
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

# Pola używane często i do budowania widoków (Danych z Requesta)
class EventBase(SQLModel):
    title: str
    description: Optional[str] = None
    date: datetime
    location: str

# Krok magiczny "table=True" zSQLModel - oznacza, puszczaj to do chmury (tabeli `events`)!
class Event(EventBase, table=True):
    __tablename__ = "events"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    # Nawiązanie więzi z idkiem user'a z pliku models.user.py
    owner_id: UUID = Field(foreign_key="users.id")
    
    # Odnosimy się do relacji. Czyli ten event ma zawsze jednego przypisanego 'user' (właściciela)
    owner: "User" = Relationship(back_populates="events")
