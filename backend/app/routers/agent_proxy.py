"""
Agent proxy router - forwards requests to standalone agent service
This avoids event loop conflicts by keeping agent in separate process
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import aiohttp
import asyncio
import json
from app.utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

# Agent service URL
AGENT_SERVICE_URL = "http://localhost:9001"


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


async def check_agent_service():
    """Check if agent service is running"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{AGENT_SERVICE_URL}/health", timeout=aiohttp.ClientTimeout(total=2)) as response:
                if response.status == 200:
                    return True
    except Exception as e:
        logger.warning(f"Agent service not available: {e}")
        return False
    return False


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new agent session (proxied to agent service)"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{AGENT_SERVICE_URL}/sessions",
                json=request.model_dump(),
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return CreateSessionResponse(**data)
                else:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=error_text)

    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to agent service: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI Agent service is not available. Make sure it's running on port 9001."
        )
    except Exception as e:
        logger.error(f"Error creating session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/message")
async def send_message(session_id: str, request: SendMessageRequest):
    """Send a message to the agent (non-streaming, proxied)"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{AGENT_SERVICE_URL}/sessions/{session_id}/message",
                json=request.model_dump(),
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=error_text)

    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to agent service: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI Agent service is not available"
        )
    except Exception as e:
        logger.error(f"Error sending message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/sessions/{session_id}/stream")
async def websocket_stream(websocket: WebSocket, session_id: str):
    """Stream agent responses via WebSocket (proxied to agent service)"""
    await websocket.accept()

    agent_ws = None
    try:
        # Connect to agent service WebSocket
        session = aiohttp.ClientSession()
        agent_ws = await session.ws_connect(
            f"{AGENT_SERVICE_URL.replace('http', 'ws')}/sessions/{session_id}/stream"
        )

        async def forward_from_client():
            """Forward messages from IDE client to agent service"""
            try:
                while True:
                    data = await websocket.receive_text()
                    await agent_ws.send_str(data)
            except WebSocketDisconnect:
                logger.info("IDE client disconnected")

        async def forward_from_agent():
            """Forward messages from agent service to IDE client"""
            try:
                async for msg in agent_ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        await websocket.send_text(msg.data)
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        logger.error(f"Agent service WebSocket error: {agent_ws.exception()}")
                        break
            except Exception as e:
                logger.error(f"Error forwarding from agent: {e}")

        # Run both forwarding tasks concurrently
        await asyncio.gather(
            forward_from_client(),
            forward_from_agent()
        )

    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to agent service WebSocket: {e}")
        await websocket.send_json({
            "type": "error",
            "error": "AI Agent service is not available"
        })
    except Exception as e:
        logger.error(f"WebSocket proxy error: {e}", exc_info=True)
        await websocket.send_json({
            "type": "error",
            "error": str(e)
        })
    finally:
        if agent_ws:
            await agent_ws.close()
        if session:
            await session.close()


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session (proxied)"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{AGENT_SERVICE_URL}/sessions/{session_id}",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=error_text)

    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to agent service: {e}")
        raise HTTPException(status_code=503, detail="AI Agent service is not available")


@router.post("/sessions/{session_id}/cancel")
async def cancel_session(session_id: str):
    """Cancel a session (proxied)"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{AGENT_SERVICE_URL}/sessions/{session_id}/cancel",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise HTTPException(status_code=response.status, detail=error_text)

    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to agent service: {e}")
        raise HTTPException(status_code=503, detail="AI Agent service is not available")
