"""
Nasz plik od spraw bezpieczeńśtwa.
Szyfrowanie haseł i wypuszczanie tokenów JWT dla Reacta.
"""
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from typing import Any, Union
from jose import jwt
from app.core.config import settings

# Biblioteka pod maską dba, by używac silnego algorytmu (Bcrypt) do hashowania
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Funkcja ta bierze np. numer ID użytkownika i zamyka go w bezpieczny, podpisany token JWT
def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
    # Kto i do kiedy - sub: np. '2', exp: godzina...
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Użytkownik wpisuje hasło "qaz123"- trzeba zobaczyć, czy jego hash w bazie zgadza się z wpisanym qaz123
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Podaje hasło "gołe" ('plain') i dostaje bezpieczny hash żeby zrzucić do bazy SQL
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
