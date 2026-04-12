"""
Ten plik czyta ze zmiennych środowiskowych (z pliku .env).
Korzystamy z biblioteki Pydantic, żeby z góry powiedzieć jakich typów oczekujemy.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Ważne: to musi być w systemie albo w .env, bo inaczej serwer się posypie!
    DATABASE_URL: str
    JWT_SECRET_KEY: str # sekretny klucz do szyfrowania i sprawdzania tokenów
    
    # Jakim algorytmem haszujemy JWT i ile minut token będzie ważny
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Automatycznie zassij zmienne z pliku .env i zignoruj inne, których Pydantic nie zna
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
