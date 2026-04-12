"""
Tutaj wsadzamy adres bazy i rozmawiamy z chmurą Neon (PostgreSQL).
Engine to 'silnik' ułatwiający zrzucanie danych. Używamy z biblioteki SQLModel.
"""
from sqlmodel import create_engine, Session
from app.core.config import settings

# Tworzymy połączenie do bazy danych, echo=True sprawi, że zapytania polecą nam w terminal
# W produkcji na serwerze można to wyłączyć, żeby nie zaśmiecać logów!
engine = create_engine(settings.DATABASE_URL, echo=True)

# Generator sesji bazodanowej - odpala się przy wejściu usera do endpointa
# a na koniec `yield` ładnie zamyka sesje. Bezpieczne i oszczędza zasoby 
def get_session():
    with Session(engine) as session:
        yield session
