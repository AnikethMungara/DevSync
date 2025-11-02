"""Code execution endpoints"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio
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
    "cpp": ["g++", "-o"],
    "c": ["gcc", "-o"],
    "go": ["go", "run"],
    "rust": ["rustc"],
    "ruby": ["ruby"],
    "php": ["php"],
    "bash": ["bash"],
    "shell": ["sh"],
}


async def execute_code_process(file_path: Path, language: str, user_input: Optional[str] = None) -> ExecutionResult:
    """Execute code file in a subprocess"""

    if language not in LANGUAGE_COMMANDS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    command = LANGUAGE_COMMANDS[language].copy()

    # Handle compiled languages
    if language in ["cpp", "c", "rust"]:
        # Create temp executable
        with tempfile.NamedTemporaryFile(delete=False, suffix=".exe" if language != "rust" else "") as tmp_exe:
            exe_path = Path(tmp_exe.name)

        if language in ["cpp", "c"]:
            command.extend([str(exe_path), str(file_path)])
            compile_cmd = command
            run_cmd = [str(exe_path)]
        else:  # rust
            compile_cmd = ["rustc", str(file_path), "-o", str(exe_path)]
            run_cmd = [str(exe_path)]

        # Compile
        try:
            compile_proc = await asyncio.create_subprocess_exec(
                *compile_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(file_path.parent)
            )
            compile_stdout, compile_stderr = await asyncio.wait_for(
                compile_proc.communicate(),
                timeout=settings.EXECUTION_TIMEOUT
            )

            if compile_proc.returncode != 0:
                return ExecutionResult(
                    success=False,
                    stdout=compile_stdout.decode('utf-8', errors='replace'),
                    stderr=compile_stderr.decode('utf-8', errors='replace'),
                    exitCode=compile_proc.returncode,
                    executionTime=0.0
                )

            # Execute compiled binary
            command = run_cmd

        except asyncio.TimeoutError:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr="Compilation timed out",
                exitCode=-1,
                executionTime=float(settings.EXECUTION_TIMEOUT)
            )
        finally:
            # Cleanup temp executable
            if exe_path.exists():
                try:
                    exe_path.unlink()
                except:
                    pass

    else:
        # Interpreted languages
        command.append(str(file_path))

    # Execute the code
    start_time = datetime.now()

    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            stdin=asyncio.subprocess.PIPE if user_input else None,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(file_path.parent)
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=user_input.encode() if user_input else None),
                timeout=settings.EXECUTION_TIMEOUT
            )

            execution_time = (datetime.now() - start_time).total_seconds()

            stdout_str = stdout.decode('utf-8', errors='replace')
            stderr_str = stderr.decode('utf-8', errors='replace')

            # Truncate output if too large
            max_size = settings.MAX_OUTPUT_SIZE
            if len(stdout_str) > max_size:
                stdout_str = stdout_str[:max_size] + "\n\n[Output truncated]"
            if len(stderr_str) > max_size:
                stderr_str = stderr_str[:max_size] + "\n\n[Output truncated]"

            return ExecutionResult(
                success=process.returncode == 0,
                stdout=stdout_str,
                stderr=stderr_str,
                exitCode=process.returncode,
                executionTime=execution_time
            )

        except asyncio.TimeoutError:
            # Kill the process
            try:
                process.kill()
                await process.wait()
            except:
                pass

            execution_time = (datetime.now() - start_time).total_seconds()

            return ExecutionResult(
                success=False,
                stdout="",
                stderr=f"Execution timed out after {settings.EXECUTION_TIMEOUT} seconds",
                exitCode=-1,
                executionTime=execution_time
            )

    except FileNotFoundError:
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=f"Command not found: {command[0]}. Make sure {language} is installed.",
            exitCode=-1,
            executionTime=0.0
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
        file_path = get_workspace_path(request.filePath)

        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {request.filePath}")

        if not file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {request.filePath}")

        logger.info(f"Executing {request.language} code: {request.filePath}")

        # Execute the code
        result = await execute_code_process(file_path, request.language, request.input)

        logger.info(f"Execution completed: {request.filePath} (exit code: {result.exitCode})")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing code: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
