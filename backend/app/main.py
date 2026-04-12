"""
Ten plik odpala nasz serwer FastAPI.
To jest punkt wejścia do aplikacji. Sklejamy tutaj routing, Corsy i inne ustawienia.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api_router import api_router

# Tworzymy aplikację FastAPI. Zobaczymy ten tytuł w docsach /docs
app = FastAPI(title="Plan It Out Backend")

# URL-e, z których frontend może pytac do backendu (rozwiązuje błąd z CORS)
origins = [
    "http://localhost:3000",
    "https://plan-it-out.vercel.app",  # Zaktualizuj domenę produkcyjną wg potrzeb
]

# Dodajemy Middleware dla CORS, żeby przeglądarka nie blokowała requestów z Reacta
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Podpinamy wszystkie endpointy pod naszą aplikację
app.include_router(api_router)

# Na potrzeby Render.com uvicorn polecenie będzie takie: 
# uvicorn app.main:app --host 0.0.0.0 --port $PORT
