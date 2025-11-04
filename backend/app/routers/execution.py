"""Code execution endpoints"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import asyncio
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from app.config import settings
from app.routers.files import get_workspace_path
from app.utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


class ExecutionRequest(BaseModel):
    """Request to execute code"""
    filePath: str
    language: str
    input: Optional[str] = None


class ExecutionResult(BaseModel):
    """Result of code execution"""
    success: bool
    stdout: str
    stderr: str
    exitCode: int
    executionTime: float


# Language to command mapping
LANGUAGE_COMMANDS = {
    "python": ["python", "-u"],
    "javascript": ["node"],
    "java": ["java"],
    "cpp": ["g++"],
    "c": ["gcc"],
    "go": ["go", "run"],
    "rust": ["rustc"],
    "ruby": ["ruby"],
    "php": ["php"],
    "bash": ["bash"],
    "shell": ["sh"],
}


def _run_subprocess_sync(command: list, cwd: str, user_input: Optional[str], timeout: int) -> tuple:
    """Synchronous subprocess execution - runs in thread pool"""
    try:
        logger.info(f"Running command: {' '.join(command)} in {cwd}")

        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE if user_input else subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cwd,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
        )

        stdout, stderr = process.communicate(
            input=user_input if user_input else None,
            timeout=timeout
        )

        logger.info(f"Command completed with exit code: {process.returncode}")
        logger.info(f"Stdout: {stdout}")
        logger.info(f"Stderr: {stderr}")

        return stdout, stderr, process.returncode, None

    except subprocess.TimeoutExpired:
        try:
            process.kill()
            process.wait(timeout=1)
        except:
            pass
        return "", f"Execution timed out after {timeout} seconds", -1, "timeout"

    except FileNotFoundError as e:
        return "", str(e), -1, "not_found"

    except Exception as e:
        logger.error(f"Subprocess error: {e}", exc_info=True)
        return "", str(e), -1, "error"


async def execute_code_process(file_path: Path, language: str, user_input: Optional[str] = None) -> ExecutionResult:
    """Execute code file in a subprocess (Windows-compatible)"""

    if language not in LANGUAGE_COMMANDS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    command = LANGUAGE_COMMANDS[language].copy()

    # For interpreted languages, just add the filename
    command.append(file_path.name)

    # Execute the code
    start_time = datetime.now()

    try:
        stdout, stderr, returncode, error_type = await asyncio.to_thread(
            _run_subprocess_sync,
            command,
            str(file_path.parent),
            user_input,
            settings.EXECUTION_TIMEOUT
        )

        execution_time = (datetime.now() - start_time).total_seconds()

        # Handle specific error types
        if error_type == "timeout":
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=stderr,
                exitCode=-1,
                executionTime=execution_time
            )

        if error_type == "not_found":
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Command not found: {command[0]}. Make sure {language} is installed.",
                exitCode=-1,
                executionTime=0.0
            )

        if error_type == "error":
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Execution error: {stderr}",
                exitCode=-1,
                executionTime=execution_time
            )

        # Truncate output if too large
        max_size = settings.MAX_OUTPUT_SIZE
        if len(stdout) > max_size:
            stdout = stdout[:max_size] + "\n\n[Output truncated]"
        if len(stderr) > max_size:
            stderr = stderr[:max_size] + "\n\n[Output truncated]"

        return ExecutionResult(
            success=returncode == 0,
            stdout=stdout,
            stderr=stderr,
            exitCode=returncode,
            executionTime=execution_time
        )

    except Exception as e:
        logger.error(f"Execution error: {e}", exc_info=True)
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=f"Execution error: {str(e)}",
            exitCode=-1,
            executionTime=0.0
        )


@router.post("/run")
async def run_code(request: ExecutionRequest):
    """Execute code from a file"""
    try:
        # Get full file path
        logger.info(f"Received execution request: filePath={request.filePath}, language={request.language}")
        file_path = get_workspace_path(request.filePath)
        logger.info(f"Resolved file path: {file_path}")

        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {request.filePath}")

        if not file_path.is_file():
            logger.error(f"Path is not a file: {file_path}")
            raise HTTPException(status_code=400, detail=f"Path is not a file: {request.filePath}")

        logger.info(f"Executing {request.language} code: {request.filePath}")

        # Execute the code
        result = await execute_code_process(file_path, request.language, request.input)

        logger.info(f"Execution completed: {request.filePath} (exit code: {result.exitCode})")

        # Return result matching frontend expectations - use JSONResponse to avoid Pydantic serialization
        return JSONResponse(content={
            "success": result.success,
            "result": {
                "exitCode": result.exitCode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.success,
                "executionTime": result.executionTime
            }
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing code: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
