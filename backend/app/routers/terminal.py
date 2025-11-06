"""
Terminal router for executing commands in the IDE.
Provides endpoints for running shell commands and managing terminal sessions.
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import os
import uuid
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Get workspace root from environment or use default
WORKSPACE_ROOT = os.getenv("WORKSPACE_ROOT", "./workspace")


class ExecuteCommandRequest(BaseModel):
    """Request to execute a command"""
    command: str
    cwd: Optional[str] = None  # Working directory (relative to workspace)
    timeout: Optional[int] = 30  # Timeout in seconds


class ExecuteCommandResponse(BaseModel):
    """Response from command execution"""
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float


class TerminalSession(BaseModel):
    """Terminal session information"""
    session_id: str
    cwd: str
    created_at: str


# Store active terminal sessions
active_sessions = {}


@router.post("/execute", response_model=ExecuteCommandResponse)
async def execute_command(request: ExecuteCommandRequest):
    """
    Execute a shell command and return the output.

    Security: Commands are executed in the workspace directory sandbox.
    """
    # Resolve working directory
    if request.cwd:
        cwd = os.path.join(WORKSPACE_ROOT, request.cwd)
        # Security: Ensure path is within workspace
        cwd_path = Path(cwd).resolve()
        workspace_path = Path(WORKSPACE_ROOT).resolve()
        if not str(cwd_path).startswith(str(workspace_path)):
            raise HTTPException(
                status_code=400,
                detail="Working directory must be within workspace"
            )
    else:
        cwd = WORKSPACE_ROOT

    # Ensure working directory exists
    os.makedirs(cwd, exist_ok=True)

    import time
    start_time = time.time()

    try:
        # Execute command with timeout
        process = await asyncio.create_subprocess_shell(
            request.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd
        )

        # Wait for command to complete with timeout
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=request.timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            raise HTTPException(
                status_code=408,
                detail=f"Command timed out after {request.timeout} seconds"
            )

        execution_time = time.time() - start_time

        return ExecuteCommandResponse(
            stdout=stdout.decode('utf-8', errors='replace'),
            stderr=stderr.decode('utf-8', errors='replace'),
            exit_code=process.returncode,
            execution_time=execution_time
        )

    except Exception as e:
        logger.error(f"Command execution failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Command execution failed: {str(e)}"
        )


@router.websocket("/ws/{session_id}")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for interactive terminal sessions.

    Provides a persistent terminal session with command history.
    """
    await websocket.accept()

    # Create or retrieve session
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "cwd": WORKSPACE_ROOT,
            "history": [],
            "created_at": asyncio.get_event_loop().time()
        }

    session = active_sessions[session_id]

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "welcome",
            "session_id": session_id,
            "cwd": session["cwd"]
        })

        while True:
            # Receive command from client
            data = await websocket.receive_json()
            command_type = data.get("type")

            if command_type == "execute":
                command = data.get("command", "").strip()

                if not command:
                    continue

                # Add to history
                session["history"].append(command)

                # Handle built-in commands
                if command.startswith("cd "):
                    # Change directory
                    new_dir = command[3:].strip()
                    try:
                        if new_dir == "..":
                            session["cwd"] = str(Path(session["cwd"]).parent)
                        elif new_dir.startswith("/") or new_dir.startswith("\\"):
                            # Absolute path - ensure it's within workspace
                            abs_path = Path(WORKSPACE_ROOT) / new_dir.lstrip("/\\")
                            session["cwd"] = str(abs_path)
                        else:
                            # Relative path
                            session["cwd"] = str(Path(session["cwd"]) / new_dir)

                        # Verify path exists and is within workspace
                        cwd_path = Path(session["cwd"]).resolve()
                        workspace_path = Path(WORKSPACE_ROOT).resolve()

                        if not str(cwd_path).startswith(str(workspace_path)):
                            session["cwd"] = WORKSPACE_ROOT
                            await websocket.send_json({
                                "type": "error",
                                "message": "Cannot navigate outside workspace"
                            })
                            continue

                        if not cwd_path.exists():
                            session["cwd"] = str(cwd_path.parent)
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Directory does not exist: {new_dir}"
                            })
                            continue

                        await websocket.send_json({
                            "type": "cwd_changed",
                            "cwd": session["cwd"]
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Failed to change directory: {str(e)}"
                        })
                    continue

                elif command == "clear":
                    # Clear terminal
                    await websocket.send_json({"type": "clear"})
                    continue

                elif command == "pwd":
                    # Print working directory
                    await websocket.send_json({
                        "type": "output",
                        "stdout": session["cwd"] + "\n",
                        "stderr": "",
                        "exit_code": 0
                    })
                    continue

                # Execute command
                try:
                    process = await asyncio.create_subprocess_shell(
                        command,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        cwd=session["cwd"]
                    )

                    # Stream output
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=30
                    )

                    await websocket.send_json({
                        "type": "output",
                        "stdout": stdout.decode('utf-8', errors='replace'),
                        "stderr": stderr.decode('utf-8', errors='replace'),
                        "exit_code": process.returncode
                    })

                except asyncio.TimeoutError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Command timed out after 30 seconds"
                    })

                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Execution failed: {str(e)}"
                    })

            elif command_type == "get_history":
                # Send command history
                await websocket.send_json({
                    "type": "history",
                    "history": session["history"]
                })

    except WebSocketDisconnect:
        logger.info(f"Terminal session {session_id} disconnected")
    except Exception as e:
        logger.error(f"Terminal WebSocket error: {e}")
    finally:
        # Keep session for reconnection (cleanup after timeout)
        pass


@router.delete("/sessions/{session_id}")
async def close_terminal_session(session_id: str):
    """Close a terminal session and cleanup resources"""
    if session_id in active_sessions:
        del active_sessions[session_id]
        return {"status": "ok", "message": "Session closed"}

    raise HTTPException(status_code=404, detail="Session not found")


@router.get("/sessions")
async def list_terminal_sessions():
    """List all active terminal sessions"""
    return {
        "sessions": [
            {
                "session_id": sid,
                "cwd": session["cwd"],
                "command_count": len(session["history"])
            }
            for sid, session in active_sessions.items()
        ]
    }
