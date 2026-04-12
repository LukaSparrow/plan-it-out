"""
Tutaj obrabiamy wejście/wyjście. Schema to taki "Celnika".
Pydantic filtruje JSON przychodzący od użytkownika (np. czy email ma małpę @).
NIE SĄ TO tabele w bazie danych. To tylko kształt danych z internetu!
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole
from app.models.user import UserBase

# Jeśli się rejestrujesz, musisz podać pełny string hasła. To wpda z POST requesta.
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    
# Czego React spodziewa się w odpowiedzi kiedy pyta kim jestem. My mu nie dajemy hasła
class UserRead(UserBase):
    id: UUID
    created_at: datetime
