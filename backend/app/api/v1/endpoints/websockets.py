from typing import Optional
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError

from app.core.config import settings
from app.websockets.manager import manager

router = APIRouter()

async def get_current_user_id_ws(token: str) -> Optional[UUID]:
    """
    Lekka weryfikacja tokena dla WebSocketów. 
    Zamiast obciążać bazę danych, po prostu dekodujemy JWT i wyciągamy user_id.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return UUID(user_id_str)
    except JWTError:
        return None

@router.websocket("/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Brak Depends(get_session)! Sesja bazy danych nie jest tu blokowana.
    user_id = await get_current_user_id_ws(token)
    if not user_id:
        await websocket.close(code=1008)  # Policy Violation / Unauthorized
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            # Pasywny WebSocket - służy tylko do odbierania powiadomień z serwera
            # Czekamy na cokolwiek (np. ping z przeglądarki), żeby uvicorn nie zamknął połączenia.
            # Całe wysyłanie wiadomości i tak idzie teraz przez POST.
            _ = await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)