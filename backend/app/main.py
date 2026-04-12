from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api_router import api_router

app = FastAPI(title="Plan It Out Backend")

origins = [
    "http://localhost:3000",
    "https://plan-it-out.vercel.app",  # Zaktualizuj domenę produkcyjną wg potrzeb
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Na potrzeby Render.com uvicorn polecenie będzie takie: 
# uvicorn app.main:app --host 0.0.0.0 --port $PORT
