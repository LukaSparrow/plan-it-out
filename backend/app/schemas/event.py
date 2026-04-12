"""
Modele - Kształty wymiany zapytań! 
Jak ktoś wysyła wniosek by zrobić event to Pydantic upewni się, że idą dobre daty, i odpowiednio wyświetli frontowi.
Żadna z tych klas NIE odpowiada wprost za modyfikacje w Bazie! Tylko weryfikacja.
"""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.event import EventBase

# Nowe np. z Reactowego UI. Dodatkowy parametr mógłby wejść np "Wymagania dla API". 
# Ale EventBase nam dziedziczy już title/desc z plikow modeli.
class EventCreate(EventBase):
    pass

# Kiedy oddajemy eventy używamy EventRead. Tutaj frontend może zassać uuid-y ownerów
class EventRead(EventBase):
    id: UUID
    owner_id: UUID
