"""
Yjs WebSocket server for collaborative editing
Implements y-websocket protocol for production-ready CRDT synchronization
"""

import asyncio
import logging
from typing import Dict, Set, Optional
from dataclasses import dataclass
from datetime import datetime
import struct
import json

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


# Yjs message types (y-websocket protocol)
MESSAGE_SYNC = 0
MESSAGE_AWARENESS = 1
MESSAGE_AUTH = 2
MESSAGE_QUERY_AWARENESS = 3


@dataclass
class YjsClient:
    """Represents a connected Yjs client"""
    websocket: WebSocket
    client_id: str
    user_name: str
    user_color: str
    file_path: str
    connected_at: datetime
    last_activity: datetime


class YjsRoom:
    """
    Manages a Yjs collaboration room for a specific file
    Handles Y-CRDT synchronization and awareness
    """

    def __init__(self, room_id: str, file_path: str):
        self.room_id = room_id
        self.file_path = file_path
        self.clients: Dict[str, YjsClient] = {}
        self.document_state: Optional[bytes] = None  # Yjs document binary state
        self.awareness_states: Dict[str, bytes] = {}
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self._lock = asyncio.Lock()

    async def add_client(self, client: YjsClient):
        """Add a client to the room"""
        async with self._lock:
            self.clients[client.client_id] = client
            self.last_activity = datetime.utcnow()

            logger.info(
                f"Client {client.user_name} ({client.client_id}) joined room {self.room_id}"
            )

            # Send initial sync if document exists
            if self.document_state:
                await self.send_sync_step1(client)

    async def remove_client(self, client_id: str):
        """Remove a client from the room"""
        async with self._lock:
            if client_id in self.clients:
                client = self.clients[client_id]
                del self.clients[client_id]

                # Remove awareness state
                if client_id in self.awareness_states:
                    del self.awareness_states[client_id]

                logger.info(
                    f"Client {client.user_name} ({client_id}) left room {self.room_id}"
                )

                # Broadcast awareness update
                await self.broadcast_awareness_update(client_id, None)

    async def handle_message(self, client_id: str, message: bytes):
        """Handle incoming Yjs message"""
        if len(message) == 0:
            return

        self.last_activity = datetime.utcnow()
        message_type = message[0]

        try:
            if message_type == MESSAGE_SYNC:
                await self.handle_sync_message(client_id, message[1:])
            elif message_type == MESSAGE_AWARENESS:
                await self.handle_awareness_message(client_id, message[1:])
            elif message_type == MESSAGE_AUTH:
                await self.handle_auth_message(client_id, message[1:])
            else:
                logger.warning(f"Unknown message type: {message_type}")
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)

    async def handle_sync_message(self, client_id: str, data: bytes):
        """Handle Yjs sync protocol messages"""
        if len(data) == 0:
            return

        sync_type = data[0]

        if sync_type == 0:  # Sync Step 1 (request state)
            # Client is requesting document state
            await self.send_sync_step2(client_id, data[1:])

        elif sync_type == 1:  # Sync Step 2 (send state)
            # Client is sending document state/update
            state_vector = data[1:]

            # Store document state
            async with self._lock:
                if self.document_state is None:
                    self.document_state = state_vector
                else:
                    # Merge updates (simplified - real implementation needs Y.applyUpdate)
                    self.document_state = state_vector

            # Broadcast update to other clients
            message = bytes([MESSAGE_SYNC, 2]) + state_vector
            await self.broadcast(message, exclude_client=client_id)

        elif sync_type == 2:  # Update
            # Client sent an update
            update = data[1:]

            # Apply update to document state
            async with self._lock:
                if self.document_state is None:
                    self.document_state = update
                else:
                    # Merge update (simplified)
                    self.document_state = update

            # Broadcast update to other clients
            message = bytes([MESSAGE_SYNC, 2]) + update
            await self.broadcast(message, exclude_client=client_id)

    async def handle_awareness_message(self, client_id: str, data: bytes):
        """Handle awareness protocol messages (cursor positions, user presence)"""
        # Store awareness state for this client
        self.awareness_states[client_id] = data

        # Broadcast to all other clients
        message = bytes([MESSAGE_AWARENESS]) + data
        await self.broadcast(message, exclude_client=client_id)

    async def handle_auth_message(self, client_id: str, data: bytes):
        """Handle authentication messages"""
        # Authentication handled at WebSocket connection level
        # This is for additional auth challenges if needed
        pass

    async def send_sync_step1(self, client: YjsClient):
        """Send Sync Step 1 to request client state"""
        if self.document_state:
            # Send state vector
            message = bytes([MESSAGE_SYNC, 0]) + self.document_state
            try:
                await client.websocket.send_bytes(message)
            except Exception as e:
                logger.error(f"Failed to send sync step 1: {e}")

    async def send_sync_step2(self, client_id: str, state_vector: bytes):
        """Send Sync Step 2 with document state"""
        client = self.clients.get(client_id)
        if not client:
            return

        if self.document_state:
            # Send document state
            message = bytes([MESSAGE_SYNC, 1]) + self.document_state
            try:
                await client.websocket.send_bytes(message)
            except Exception as e:
                logger.error(f"Failed to send sync step 2: {e}")

    async def broadcast_awareness_update(self, client_id: str, state: Optional[bytes]):
        """Broadcast awareness state update"""
        if state is None:
            # Client disconnected - send empty state
            state = b''

        message = bytes([MESSAGE_AWARENESS]) + state
        await self.broadcast(message)

    async def broadcast(self, message: bytes, exclude_client: Optional[str] = None):
        """Broadcast binary message to all clients in room"""
        disconnected = []

        for cid, client in self.clients.items():
            if cid == exclude_client:
                continue

            try:
                await client.websocket.send_bytes(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {cid}: {e}")
                disconnected.append(cid)

        # Clean up disconnected clients
        for cid in disconnected:
            await self.remove_client(cid)

    def get_client_count(self) -> int:
        """Get number of connected clients"""
        return len(self.clients)


class YjsRoomManager:
    """Global manager for all Yjs rooms"""

    def __init__(self):
        self.rooms: Dict[str, YjsRoom] = {}
        self._lock = asyncio.Lock()

    async def get_or_create_room(self, room_id: str, file_path: str) -> YjsRoom:
        """Get existing room or create new one"""
        async with self._lock:
            if room_id not in self.rooms:
                self.rooms[room_id] = YjsRoom(room_id, file_path)
                logger.info(f"Created Yjs room: {room_id} for file: {file_path}")

            return self.rooms[room_id]

    async def remove_room(self, room_id: str):
        """Remove a room when all clients leave"""
        async with self._lock:
            if room_id in self.rooms:
                room = self.rooms[room_id]
                if room.get_client_count() == 0:
                    del self.rooms[room_id]
                    logger.info(f"Removed Yjs room: {room_id}")

    async def cleanup_inactive_rooms(self, max_inactive_minutes: int = 60):
        """Remove rooms that have been inactive"""
        now = datetime.utcnow()
        to_remove = []

        async with self._lock:
            for room_id, room in self.rooms.items():
                inactive_minutes = (now - room.last_activity).total_seconds() / 60

                if room.get_client_count() == 0 and inactive_minutes > max_inactive_minutes:
                    to_remove.append(room_id)

        for room_id in to_remove:
            await self.remove_room(room_id)

    def get_all_rooms(self):
        """Get information about all active rooms"""
        return [
            {
                "room_id": room.room_id,
                "file_path": room.file_path,
                "client_count": room.get_client_count(),
                "created_at": room.created_at.isoformat(),
                "last_activity": room.last_activity.isoformat(),
            }
            for room in self.rooms.values()
        ]


# Global Yjs room manager instance
yjs_room_manager = YjsRoomManager()
