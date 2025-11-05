"""Agent router with REST and WebSocket endpoints"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.agent.session_manager import session_manager
from app.agent.types import ChatChunk, ChatChunkType
from app.utils.logger import setup_logger
import json

router = APIRouter()
logger = setup_logger(__name__)


class CreateSessionRequest(BaseModel):
    """Request to create a new session"""
    model: Optional[str] = None
    allow_tools: Optional[List[str]] = None
    temperature: float = 0.7


class CreateSessionResponse(BaseModel):
    """Response with new session ID"""
    session_id: str


class SendMessageRequest(BaseModel):
    """Request to send a message"""
    text: str


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new agent session"""
    try:
        session_id = session_manager.create_session(
            model=request.model,
            allow_tools=request.allow_tools,
            temperature=request.temperature
        )

        return CreateSessionResponse(session_id=session_id)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/message")
async def send_message(session_id: str, request: SendMessageRequest):
    """Send a message to a session (non-streaming)"""
    try:
        session = session_manager.get_session(session_id)
        response = await session.send_message(request.text, stream=False)

        return {
            "session_id": session_id,
            "response": response,
            "messages": [
                {"role": msg.role.value, "content": msg.content}
                for msg in session.messages
            ]
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/cancel")
async def cancel_session(session_id: str):
    """Cancel a session's current operation"""
    try:
        session_manager.cancel_session(session_id)
        return {"status": "cancelled", "session_id": session_id}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    try:
        session_manager.delete_session(session_id)
        return {"status": "deleted", "session_id": session_id}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/sessions/{session_id}/stream")
async def websocket_stream(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for streaming chat"""
    await websocket.accept()

    try:
        session = session_manager.get_session(session_id)

        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Check message type
            if message.get("type") == "cancel":
                session.cancel()
                await websocket.send_json({
                    "type": "cancelled"
                })
                continue

            # Get user text
            user_text = message.get("text")
            if not user_text:
                await websocket.send_json({
                    "type": "error",
                    "message": "No text provided"
                })
                continue

            # Send message and stream response
            try:
                async for chunk in await session.send_message(user_text, stream=True):
                    # Convert chunk to dict
                    chunk_dict = {
                        "type": chunk.type.value
                    }

                    if chunk.type == ChatChunkType.TEXT:
                        chunk_dict["delta"] = chunk.delta

                    elif chunk.type == ChatChunkType.TOOL_CALL:
                        chunk_dict["tool_name"] = chunk.tool_name
                        chunk_dict["tool_args"] = chunk.tool_args

                    elif chunk.type == ChatChunkType.TOOL_RESULT:
                        chunk_dict["tool_name"] = chunk.tool_name
                        chunk_dict["tool_result"] = chunk.tool_result
                        chunk_dict["truncated"] = chunk.truncated

                    elif chunk.type == ChatChunkType.ERROR:
                        chunk_dict["error"] = chunk.error

                    # Send chunk
                    await websocket.send_json(chunk_dict)

            except Exception as e:
                logger.error(f"Error in stream: {e}", exc_info=True)
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except ValueError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        await websocket.send_json({"type": "error", "message": "Internal error"})
        await websocket.close()
