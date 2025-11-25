"""
Yjs collaboration router with WebSocket support
Includes authentication and rate limiting
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from typing import Optional
import uuid
import logging

from app.collaboration.yjs_server import (
    yjs_room_manager,
    YjsClient
)
from app.auth.jwt_handler import verify_websocket_token
from app.middleware.rate_limit import rate_limiter
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/yjs/{session_id}/ws")
async def yjs_websocket(
    websocket: WebSocket,
    session_id: str,
    file: str = Query(...),
    user: str = Query(...),
    color: str = Query("#4ECDC4"),
    token: Optional[str] = Query(None),
):
    """
    Yjs WebSocket endpoint for real-time collaborative editing

    Args:
        session_id: Collaboration session ID
        file: File path being edited
        user: Username
        color: User color for cursor/presence
        token: Optional JWT authentication token

    Protocol:
        Implements y-websocket protocol for CRDT synchronization
        Binary messages with type prefixes (sync, awareness, auth)
    """
    client_id = str(uuid.uuid4())
    client_ip = websocket.client.host if websocket.client else "unknown"

    # Rate limit check
    allowed, error = await rate_limiter.check_rate_limit(
        client_ip,
        limit_type="websocket_connect"
    )
    if not allowed:
        await websocket.close(code=1008, reason=error)
        return

    # Optional authentication
    authenticated_user = None
    if token:
        authenticated_user = verify_websocket_token(token)
        if not authenticated_user:
            logger.warning(f"Invalid token from {client_ip}")
            await websocket.close(code=1008, reason="Invalid authentication token")
            return
        # Use authenticated username
        user = authenticated_user.username

    await websocket.accept()
    logger.info(f"Yjs WebSocket connected: {user} ({client_id}) to session {session_id}")

    # Create client object
    client = YjsClient(
        websocket=websocket,
        client_id=client_id,
        user_name=user,
        user_color=color,
        file_path=file,
        connected_at=datetime.utcnow(),
        last_activity=datetime.utcnow(),
    )

    # Get or create room
    room = await yjs_room_manager.get_or_create_room(
        room_id=f"{session_id}:{file}",
        file_path=file
    )

    # Add client to room
    await room.add_client(client)

    try:
        while True:
            # Receive binary message
            data = await websocket.receive_bytes()

            # Rate limit messages
            allowed, error = await rate_limiter.check_rate_limit(
                client_id,
                limit_type="websocket_message"
            )
            if not allowed:
                logger.warning(f"Rate limit exceeded for {user} ({client_id})")
                await websocket.send_text(f"Error: {error}")
                continue

            # Update last activity
            client.last_activity = datetime.utcnow()

            # Handle Yjs message
            await room.handle_message(client_id, data)

    except WebSocketDisconnect:
        logger.info(f"Yjs WebSocket disconnected: {user} ({client_id})")

    except Exception as e:
        logger.error(f"Yjs WebSocket error for {user}: {e}", exc_info=True)

    finally:
        # Remove client from room
        await room.remove_client(client_id)

        # Clean up empty room
        if room.get_client_count() == 0:
            await yjs_room_manager.remove_room(room.room_id)


@router.get("/yjs/rooms")
async def list_yjs_rooms():
    """
    List all active Yjs collaboration rooms

    Returns information about active rooms and connected clients
    """
    return {
        "rooms": yjs_room_manager.get_all_rooms(),
        "total_rooms": len(yjs_room_manager.rooms)
    }


@router.get("/yjs/rooms/{room_id}")
async def get_yjs_room(room_id: str):
    """
    Get information about a specific Yjs room

    Args:
        room_id: Room identifier

    Returns:
        Room details and connected clients
    """
    room = yjs_room_manager.rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return {
        "room_id": room.room_id,
        "file_path": room.file_path,
        "client_count": room.get_client_count(),
        "clients": [
            {
                "client_id": client.client_id,
                "user_name": client.user_name,
                "user_color": client.user_color,
                "connected_at": client.connected_at.isoformat(),
                "last_activity": client.last_activity.isoformat(),
            }
            for client in room.clients.values()
        ],
        "created_at": room.created_at.isoformat(),
        "last_activity": room.last_activity.isoformat(),
    }


@router.delete("/yjs/rooms/{room_id}")
async def close_yjs_room(room_id: str):
    """
    Force close a Yjs room (admin only)

    Args:
        room_id: Room identifier to close

    Returns:
        Success message
    """
    room = yjs_room_manager.rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Disconnect all clients
    for client in list(room.clients.values()):
        try:
            await client.websocket.close(code=1000, reason="Room closed by admin")
        except:
            pass

    # Remove room
    await yjs_room_manager.remove_room(room_id)

    return {"message": f"Room {room_id} closed successfully"}
