"""
Collaboration router for real-time multi-user editing.
Provides WebSocket endpoints for presence, cursor sharing, and document sync.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import json
import uuid
import logging

from app.collaboration.session_manager import collaboration_manager, User

router = APIRouter()
logger = logging.getLogger(__name__)


class CreateSessionRequest(BaseModel):
    """Request to create a new collaboration session"""
    session_name: Optional[str] = None


class CreateSessionResponse(BaseModel):
    """Response with new session ID"""
    session_id: str
    session_name: str


class JoinSessionRequest(BaseModel):
    """Request to join a collaboration session"""
    session_id: str
    user_name: str
    user_color: Optional[str] = None
    user_avatar: Optional[str] = None


class SessionStateResponse(BaseModel):
    """Current state of a collaboration session"""
    session_id: str
    users: List[dict]
    cursors: List[dict]
    selections: List[dict]
    document_versions: dict
    user_count: int


# User colors for collaborative editing
USER_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
]


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """
    Create a new collaboration session.
    Returns a unique session ID that users can join.
    """
    session_id = str(uuid.uuid4())
    session_name = request.session_name or f"Session {session_id[:8]}"

    # Create the session (it will be created on first join)
    logger.info(f"Created collaboration session: {session_id}")

    return CreateSessionResponse(
        session_id=session_id,
        session_name=session_name
    )


@router.get("/sessions", response_model=List[dict])
async def list_sessions():
    """
    List all active collaboration sessions.
    """
    return collaboration_manager.get_all_sessions()


@router.get("/sessions/{session_id}", response_model=SessionStateResponse)
async def get_session_state(session_id: str):
    """
    Get the current state of a collaboration session.
    """
    if session_id not in collaboration_manager.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = collaboration_manager.sessions[session_id]
    state = session.get_state()

    return SessionStateResponse(**state)


@router.websocket("/sessions/{session_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    user_name: str = Query(...),
    user_color: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time collaboration.

    Clients connect to this endpoint to participate in collaborative editing.
    Messages are broadcast to all users in the same session.

    Message types:
    - cursor_update: User cursor moved
    - selection_update: User selected text
    - document_edit: User edited a document
    - user_joined: New user joined session
    - user_left: User left session
    - chat_message: User sent a chat message
    """
    await websocket.accept()

    # Generate user ID and assign color
    user_id = str(uuid.uuid4())
    if not user_color:
        # Assign color based on user count
        session = await collaboration_manager.get_or_create_session(session_id)
        color_index = len(session.users) % len(USER_COLORS)
        user_color = USER_COLORS[color_index]

    user = User(
        id=user_id,
        name=user_name,
        color=user_color
    )

    session = await collaboration_manager.get_or_create_session(session_id)

    try:
        # Add user to session
        await session.add_user(user_id, user, websocket)

        # Send initial session state to the new user
        await websocket.send_json({
            "type": "session_state",
            "data": session.get_state(),
            "your_user_id": user_id
        })

        # Listen for messages from this user
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get("type")

            if message_type == "cursor_update":
                # Update cursor position
                await session.update_cursor(
                    user_id=user_id,
                    file_path=message["file_path"],
                    line=message["line"],
                    column=message["column"]
                )

            elif message_type == "selection_update":
                # Update text selection
                await session.update_selection(
                    user_id=user_id,
                    file_path=message["file_path"],
                    start_line=message["start_line"],
                    start_column=message["start_column"],
                    end_line=message["end_line"],
                    end_column=message["end_column"]
                )

            elif message_type == "document_edit":
                # Broadcast document edit
                await session.broadcast_edit(
                    user_id=user_id,
                    file_path=message["file_path"],
                    operation=message["operation"],
                    data=message["data"]
                )

            elif message_type == "chat_message":
                # Broadcast chat message
                await session.broadcast({
                    "type": "chat_message",
                    "user_id": user_id,
                    "user_name": user.name,
                    "user_color": user.color,
                    "message": message["message"],
                    "timestamp": message.get("timestamp")
                })

            elif message_type == "ping":
                # Respond to ping with pong
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info(f"User {user_name} disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_name}: {e}", exc_info=True)
    finally:
        # Remove user from session
        await session.remove_user(user_id)

        # Remove session if no users left
        if len(session.users) == 0:
            await collaboration_manager.remove_session(session_id)


@router.post("/sessions/{session_id}/leave")
async def leave_session(session_id: str, user_id: str):
    """
    Manually leave a collaboration session.
    Normally handled automatically when WebSocket disconnects.
    """
    if session_id not in collaboration_manager.sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = collaboration_manager.sessions[session_id]
    await session.remove_user(user_id)

    return {"status": "ok", "message": "Left session"}
