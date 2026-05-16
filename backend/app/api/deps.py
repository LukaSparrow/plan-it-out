"""
Wspólne zależności FastAPI używane w endpointach przez Depends().
SessionDep — sesja bazy danych (auto-zamykana po zakończeniu requesta).
get_current_user — dekoduje JWT z nagłówka Authorization i zwraca obiekt User.
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session, select
from app.core.config import settings
from app.db.database import get_session
from app.models.user import User
from app.schemas.token import TokenPayload

# FastAPI automatycznie wyciąga token Bearer z nagłówka Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Wygodne aliasy typów — używamy jako parametry funkcji endpointów
SessionDep = Annotated[Session, Depends(get_session)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """Weryfikuje JWT i zwraca zalogowanego użytkownika. Rzuca 401 przy nieważnym tokenie."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Szukamy usera w bazie — token może być ważny, ale user mógł zostać usunięty
    user = session.get(User, token_data.sub)
    if user is None:
        raise credentials_exception
    return user
