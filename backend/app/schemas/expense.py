"""
Schematy Pydantic dla wydatków.
ExpenseCreate akceptuje listę UUID-ów uczestników, między których dzielimy koszt.
Balance to wynik silnika Splittera - "X winien Y kwotę Z".
"""
from pydantic import BaseModel, Field
from typing import List
from uuid import UUID
from datetime import datetime
from app.schemas.user import UserPublic


class ExpenseCreate(BaseModel):
    description: str
    amount: float = Field(gt=0, description="Kwota musi być większa od 0")
    currency: str = Field(default="PLN", min_length=3, max_length=3)
    split_among: List[UUID] = Field(min_length=1, description="UUID-y uczestników")


class ExpenseRead(BaseModel):
    id: UUID
    event_id: UUID
    description: str
    amount: float
    currency: str
    created_at: datetime
    paid_by: UserPublic
    split_among: List[UUID]   # Płaska lista UUID-ów - frontend robi resolve sam

    model_config = {"from_attributes": True}


class Balance(BaseModel):
    """Wynik silnika Splittera - X winien Y konkretną kwotę."""
    from_user: UserPublic = Field(alias="from")
    to_user: UserPublic = Field(alias="to")
    amount: float

    model_config = {"populate_by_name": True}
