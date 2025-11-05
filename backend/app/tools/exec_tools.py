"""Execution tools with sandboxing"""
import asyncio
import signal
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import settings
from app.tools.fs_tools import validate_path, PathSecurityError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


async def run_command(
    cmd: str,
    args: List[str] = None,
    cwd: str = ".",
    timeout_sec: int = 30
) -> Dict[str, Any]:
    """
    Run a shell command in the workspace sandbox.

    Args:
        cmd: Command to execute
        args: Command arguments
        cwd: Working directory relative to workspace root
        timeout_sec: Timeout in seconds

    Returns:
        Dict with stdout, stderr, exit code
    """
    workspace_root = Path(settings.WORKSPACE_ROOT).resolve()
    args = args or []

    try:
        # Validate working directory
        work_dir = validate_path(cwd, workspace_root)
        if not work_dir.exists():
            return {"error": f"Working directory does not exist: {cwd}"}

        # Enforce timeout limit
        max_timeout = settings.AGENT_MAX_RUN_SECONDS
        if timeout_sec > max_timeout:
            timeout_sec = max_timeout

        # Build command
        full_cmd = [cmd] + args

        logger.info(f"Running command: {' '.join(full_cmd)} in {work_dir}")

        # Create subprocess
        process = await asyncio.create_subprocess_exec(
            *full_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(work_dir),
            # On Unix, create process group for proper cleanup
            preexec_fn=os.setsid if os.name != 'nt' else None
        )

        try:
            # Wait for completion with timeout
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout_sec
            )

            return {
                "stdout": stdout.decode('utf-8', errors='replace'),
                "stderr": stderr.decode('utf-8', errors='replace'),
                "exit_code": process.returncode,
                "timed_out": False,
                "success": process.returncode == 0
            }

        except asyncio.TimeoutError:
            # Kill process group on timeout
            try:
                if os.name != 'nt':
                    # Unix: kill process group
                    os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                else:
                    # Windows: kill process
                    process.kill()

                await process.wait()
            except:
                pass

            return {
                "stdout": "",
                "stderr": f"Command timed out after {timeout_sec} seconds",
                "exit_code": -1,
                "timed_out": True,
                "success": False
            }

    except PathSecurityError as e:
        logger.warning(f"Security violation in run_command: {e}")
        return {"error": str(e)}
    except FileNotFoundError:
        return {"error": f"Command not found: {cmd}"}
    except Exception as e:
        logger.error(f"Error running command: {e}", exc_info=True)
        return {"error": f"Failed to run command: {str(e)}"}


async def run_tests(command: str) -> Dict[str, Any]:
    """
    Run test command.

    Args:
        command: Test command to run (e.g., 'pytest', 'npm test')

    Returns:
        Dict with test results
    """
    # Parse command and args
    parts = command.split()
    if not parts:
        return {"error": "Empty command"}

    cmd = parts[0]
    args = parts[1:] if len(parts) > 1 else []

    # Use longer timeout for tests
    timeout = min(settings.AGENT_MAX_RUN_SECONDS, 120)

    result = await run_command(cmd, args, cwd=".", timeout_sec=timeout)

    # Add test-specific context
    if "error" not in result:
        result["is_test_run"] = True

    return result
