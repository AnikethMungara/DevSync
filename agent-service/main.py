"""
Standalone AI Agent Service
Runs independently on port 9001 to avoid event loop conflicts with main IDE backend
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import sys
import os
from pathlib import Path

# Add parent directory to path to import from backend
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.agent.session_manager import session_manager
from app.agent.types import ChatChunk, ChatChunkType
from app.config import settings
import logging
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DevSync AI Agent Service",
    description="Standalone AI agent service for DevSync IDE",
    version="1.0.0"
)

# CORS middleware - allow IDE backend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8787", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
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


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "ai-agent",
        "version": "1.0.0"
    }


# Session management endpoints
@app.post("/sessions", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new agent session"""
    try:
        session_id = session_manager.create_session(
            model=request.model,
            allow_tools=request.allow_tools,
            temperature=request.temperature
        )
        logger.info(f"Created session: {session_id}")
        return CreateSessionResponse(session_id=session_id)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{session_id}/message")
async def send_message(session_id: str, request: SendMessageRequest):
    """Send a message to the agent (non-streaming)"""
    try:
        session = session_manager.get_session(session_id)
        response = await session.send_message(request.text, stream=False)

        return {
            "role": "assistant",
            "content": response.get("content", ""),
            "tool_calls": response.get("tool_calls", [])
        }

    except KeyError:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    except Exception as e:
        logger.error(f"Error sending message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/sessions/{session_id}/stream")
async def websocket_stream(websocket: WebSocket, session_id: str):
    """Stream agent responses via WebSocket"""
    await websocket.accept()

    try:
        session = session_manager.get_session(session_id)

        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message = data.get("text", "")

            if not message:
                await websocket.send_json({
                    "type": "error",
                    "error": "Empty message"
                })
                continue

            # Stream response chunks
            async for chunk in session.send_message(message, stream=True):
                chunk_data = {
                    "type": chunk.type.value,
                }

                if chunk.type == ChatChunkType.TEXT:
                    chunk_data["delta"] = chunk.delta
                elif chunk.type == ChatChunkType.TOOL_CALL:
                    chunk_data["tool_name"] = chunk.tool_name
                    chunk_data["tool_args"] = chunk.tool_args
                elif chunk.type == ChatChunkType.TOOL_RESULT:
                    chunk_data["tool_name"] = chunk.tool_name
                    chunk_data["tool_result"] = chunk.tool_result
                elif chunk.type == ChatChunkType.ERROR:
                    chunk_data["error"] = chunk.error
                elif chunk.type == ChatChunkType.DONE:
                    chunk_data["content"] = chunk.content

                await websocket.send_json(chunk_data)

                # Stop if done or error
                if chunk.type in [ChatChunkType.DONE, ChatChunkType.ERROR]:
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except KeyError:
        await websocket.send_json({
            "type": "error",
            "error": f"Session {session_id} not found"
        })
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    try:
        session_manager.delete_session(session_id)
        return {"success": True}
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")


@app.post("/sessions/{session_id}/cancel")
async def cancel_session(session_id: str):
    """Cancel a session's current operation"""
    try:
        session_manager.cancel_session(session_id)
        return {"success": True}
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")


if __name__ == "__main__":
    logger.info("Starting AI Agent Service on port 9001...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=9001,
        reload=True,
        log_level="info"
    )
