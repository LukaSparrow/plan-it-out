"""
Klasy pydantica sprawdzające tokeny jwt wypchane z API.
Odgrywają rolę kontraktu: mówią co front wyciągnie po udanym logowaniu.
"""
from pydantic import BaseModel

# Klasa tego zwrotu: { "access_token": "jakiś-hash-xyz" , "token_type": "bearer"}
class Token(BaseModel):
    access_token: str
    token_type: str

# Sprawdzanai payloadów tjj wnetrzności rozszyfrowanego jwt (np ID usera - 'sub') 
class TokenPayload(BaseModel):
    sub: str | None = None
