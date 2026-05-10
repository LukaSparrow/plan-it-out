from typing import Dict, List
from fastapi import WebSocket
from uuid import UUID

class ConnectionManager:
    def __init__(self):
        # Aktywne połączenia globalne użytkowników: Dict[UUID, WebSocket]
        self.active_connections: Dict[UUID, WebSocket] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: UUID):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: UUID):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

    async def broadcast_to_users(self, user_ids: List[UUID], message: dict):
        for user_id in user_ids:
            if user_id in self.active_connections:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)

manager = ConnectionManager()
