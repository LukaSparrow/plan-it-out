from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.api.deps import SessionDep, get_current_user
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserRead
from app.schemas.token import Token

router = APIRouter()

@router.post("/register", response_model=UserRead)
def register(session: SessionDep, user_in: UserCreate) -> Any:
    user = session.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user_create = User.model_validate(user_in, update={"hashed_password": security.get_password_hash(user_in.password)})
    session.add(user_create)
    session.commit()
    session.refresh(user_create)
    return user_create

from fastapi.security import OAuth2PasswordRequestForm
@router.post("/login", response_model=Token)
def login(session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserRead)
def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user
