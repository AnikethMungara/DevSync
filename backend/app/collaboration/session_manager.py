"""
Collaboration session manager for real-time multi-user editing.
Manages active sessions, user presence, and document state.
"""

import asyncio
import json
from typing import Dict, Set, Optional, List
from datetime import datetime
from dataclasses import dataclass, asdict
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


@dataclass
class User:
    """Represents a connected user"""
    id: str
    name: str
    color: str
    avatar: Optional[str] = None


@dataclass
class Cursor:
    """Represents a user's cursor position"""
    user_id: str
    file_path: str
    line: int
    column: int
    timestamp: str


@dataclass
class Selection:
    """Represents a user's text selection"""
    user_id: str
    file_path: str
    start_line: int
    start_column: int
    end_line: int
    end_column: int


class CollaborationSession:
    """Manages a single collaboration session (workspace)"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.users: Dict[str, User] = {}
        self.connections: Dict[str, WebSocket] = {}
        self.cursors: Dict[str, Cursor] = {}
        self.selections: Dict[str, Selection] = {}
        self.document_versions: Dict[str, int] = {}  # file_path -> version
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()

    async def add_user(self, user_id: str, user: User, websocket: WebSocket):
        """Add a user to the session"""
        self.users[user_id] = user
        self.connections[user_id] = websocket
        self.last_activity = datetime.utcnow()

        logger.info(f"User {user.name} ({user_id}) joined session {self.session_id}")

        # Notify other users
        await self.broadcast({
            "type": "user_joined",
            "user": asdict(user),
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)

    async def remove_user(self, user_id: str):
        """Remove a user from the session"""
        if user_id not in self.users:
            return

        user = self.users[user_id]
        del self.users[user_id]

        if user_id in self.connections:
            del self.connections[user_id]

        if user_id in self.cursors:
            del self.cursors[user_id]

        if user_id in self.selections:
            del self.selections[user_id]

        logger.info(f"User {user.name} ({user_id}) left session {self.session_id}")

        # Notify other users
        await self.broadcast({
            "type": "user_left",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    async def update_cursor(self, user_id: str, file_path: str, line: int, column: int):
        """Update a user's cursor position"""
        cursor = Cursor(
            user_id=user_id,
            file_path=file_path,
            line=line,
            column=column,
            timestamp=datetime.utcnow().isoformat()
        )
        self.cursors[user_id] = cursor
        self.last_activity = datetime.utcnow()

        # Broadcast cursor update
        await self.broadcast({
            "type": "cursor_update",
            "cursor": asdict(cursor)
        }, exclude_user=user_id)

    async def update_selection(
        self,
        user_id: str,
        file_path: str,
        start_line: int,
        start_column: int,
        end_line: int,
        end_column: int
    ):
        """Update a user's text selection"""
        selection = Selection(
            user_id=user_id,
            file_path=file_path,
            start_line=start_line,
            start_column=start_column,
            end_line=end_line,
            end_column=end_column
        )
        self.selections[user_id] = selection
        self.last_activity = datetime.utcnow()

        # Broadcast selection update
        await self.broadcast({
            "type": "selection_update",
            "selection": asdict(selection)
        }, exclude_user=user_id)

    async def broadcast_edit(
        self,
        user_id: str,
        file_path: str,
        operation: str,
        data: dict
    ):
        """Broadcast a document edit operation"""
        # Increment document version
        current_version = self.document_versions.get(file_path, 0)
        new_version = current_version + 1
        self.document_versions[file_path] = new_version
        self.last_activity = datetime.utcnow()

        await self.broadcast({
            "type": "document_edit",
            "user_id": user_id,
            "file_path": file_path,
            "operation": operation,
            "data": data,
            "version": new_version,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude_user=user_id)

    async def broadcast(self, message: dict, exclude_user: Optional[str] = None):
        """Broadcast a message to all connected users"""
        disconnected_users = []

        for user_id, websocket in self.connections.items():
            if user_id == exclude_user:
                continue

            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                disconnected_users.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.remove_user(user_id)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user"""
        if user_id not in self.connections:
            return

        try:
            await self.connections[user_id].send_json(message)
        except Exception as e:
            logger.error(f"Failed to send message to user {user_id}: {e}")
            await self.remove_user(user_id)

    def get_state(self) -> dict:
        """Get the current session state"""
        return {
            "session_id": self.session_id,
            "users": [asdict(user) for user in self.users.values()],
            "cursors": [asdict(cursor) for cursor in self.cursors.values()],
            "selections": [asdict(selection) for selection in self.selections.values()],
            "document_versions": self.document_versions,
            "user_count": len(self.users)
        }


class CollaborationManager:
    """Global manager for all collaboration sessions"""

    def __init__(self):
        self.sessions: Dict[str, CollaborationSession] = {}
        self._lock = asyncio.Lock()

    async def get_or_create_session(self, session_id: str) -> CollaborationSession:
        """Get an existing session or create a new one"""
        async with self._lock:
            if session_id not in self.sessions:
                self.sessions[session_id] = CollaborationSession(session_id)
                logger.info(f"Created new collaboration session: {session_id}")

            return self.sessions[session_id]

    async def remove_session(self, session_id: str):
        """Remove a session (when all users leave)"""
        async with self._lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
                logger.info(f"Removed collaboration session: {session_id}")

    async def cleanup_inactive_sessions(self, max_inactive_hours: int = 24):
        """Remove sessions that have been inactive for too long"""
        now = datetime.utcnow()
        to_remove = []

        async with self._lock:
            for session_id, session in self.sessions.items():
                inactive_hours = (now - session.last_activity).total_seconds() / 3600

                if len(session.users) == 0 and inactive_hours > max_inactive_hours:
                    to_remove.append(session_id)

        for session_id in to_remove:
            await self.remove_session(session_id)

    def get_all_sessions(self) -> List[dict]:
        """Get information about all active sessions"""
        return [
            {
                "session_id": session.session_id,
                "user_count": len(session.users),
                "created_at": session.created_at.isoformat(),
                "last_activity": session.last_activity.isoformat()
            }
            for session in self.sessions.values()
        ]


# Global collaboration manager instance
collaboration_manager = CollaborationManager()
