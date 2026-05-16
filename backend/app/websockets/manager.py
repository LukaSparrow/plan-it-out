"""
Manager połączeń WebSocket — przechowuje aktywne połączenia i rozsyła powiadomienia.
Jeden użytkownik = jedno połączenie (nowe połączenie nadpisuje stare, np. po odświeżeniu strony).
"""
from typing import Dict, List
from fastapi import WebSocket
from uuid import UUID


class ConnectionManager:
    def __init__(self):
        # Słownik: user_id → aktywne połączenie WebSocket
        self.active_connections: Dict[UUID, WebSocket] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket):
        """Rejestruje nowe połączenie WebSocket dla danego użytkownika."""
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: UUID):
        """Usuwa połączenie po rozłączeniu klienta."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: UUID):
        """Wysyła wiadomość do konkretnego użytkownika (jeśli jest online)."""
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Rozsyła wiadomość do wszystkich połączonych użytkowników."""
        for connection in self.active_connections.values():
            await connection.send_json(message)

    async def broadcast_to_users(self, user_ids: List[UUID], message: dict):
        """Rozsyła wiadomość do wybranej listy użytkowników (pomija offline)."""
        for user_id in user_ids:
            if user_id in self.active_connections:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)


# Singleton — jedna instancja na cały proces uvicorn
manager = ConnectionManager()
