"""Filesystem tools with security sandbox"""
import os
from pathlib import Path
from typing import Dict, Any, List
import aiofiles
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class PathSecurityError(Exception):
    """Raised when path violates security constraints"""
    pass


def validate_path(path: str, workspace_root: Path) -> Path:
    """
    Validate and normalize path to ensure it's within workspace root.

    Raises PathSecurityError if path is invalid or outside workspace.
    """
    try:
        # Normalize the path
        if not path or path == ".":
            return workspace_root

        # Combine with workspace root
        full_path = (workspace_root / path).resolve()

        # Ensure resolved path is within workspace
        workspace_resolved = workspace_root.resolve()
        if not str(full_path).startswith(str(workspace_resolved)):
            raise PathSecurityError(f"Path traversal detected: {path}")

        # Check for symlinks pointing outside workspace
        if full_path.is_symlink():
            link_target = full_path.readlink()
            if link_target.is_absolute() and not str(link_target).startswith(str(workspace_resolved)):
                raise PathSecurityError(f"Symlink points outside workspace: {path}")

        return full_path

    except Exception as e:
        if isinstance(e, PathSecurityError):
            raise
        raise PathSecurityError(f"Invalid path: {path} - {str(e)}")


async def list_files(path: str = ".", max_depth: int = 2) -> Dict[str, Any]:
    """
    List files and directories in a path.

    Args:
        path: Relative path from workspace root
        max_depth: Maximum depth to traverse

    Returns:
        Dict with file tree structure
    """
    workspace_root = Path(settings.WORKSPACE_ROOT).resolve()

    try:
        target_path = validate_path(path, workspace_root)

        if not target_path.exists():
            return {"error": f"Path does not exist: {path}"}

        if not target_path.is_dir():
            return {"error": f"Path is not a directory: {path}"}

        def build_tree(current_path: Path, current_depth: int = 0) -> List[Dict[str, Any]]:
            """Recursively build directory tree"""
            if current_depth >= max_depth:
                return []

            items = []
            try:
                for item in sorted(current_path.iterdir()):
                    # Skip hidden files and common ignore patterns
                    if item.name.startswith('.') or item.name in ['node_modules', '__pycache__', 'venv']:
                        continue

                    rel_path = item.relative_to(workspace_root)
                    item_dict = {
                        "name": item.name,
                        "path": str(rel_path),
                        "type": "directory" if item.is_dir() else "file"
                    }

                    if item.is_file():
                        try:
                            item_dict["size"] = item.stat().st_size
                        except:
                            pass
                    elif item.is_dir() and current_depth < max_depth - 1:
                        item_dict["children"] = build_tree(item, current_depth + 1)

                    items.append(item_dict)
            except PermissionError:
                pass

            return items

        tree = build_tree(target_path)

        return {
            "path": path,
            "items": tree,
            "count": len(tree)
        }

    except PathSecurityError as e:
        logger.warning(f"Security violation in list_files: {e}")
        return {"error": str(e)}
    except Exception as e:
        logger.error(f"Error listing files: {e}", exc_info=True)
        return {"error": f"Failed to list files: {str(e)}"}


async def read_file(path: str, max_bytes: int = 200000) -> Dict[str, Any]:
    """
    Read file contents.

    Args:
        path: Relative path from workspace root
        max_bytes: Maximum bytes to read

    Returns:
        Dict with file content or error
    """
    workspace_root = Path(settings.WORKSPACE_ROOT).resolve()

    try:
        file_path = validate_path(path, workspace_root)

        if not file_path.exists():
            return {"error": f"File does not exist: {path}"}

        if not file_path.is_file():
            return {"error": f"Path is not a file: {path}"}

        # Check file size
        file_size = file_path.stat().st_size
        if file_size > max_bytes:
            return {
                "error": f"File too large: {file_size} bytes (max: {max_bytes})",
                "truncated": True
            }

        # Read file
        async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = await f.read(max_bytes)

        return {
            "path": path,
            "content": content,
            "size": len(content),
            "encoding": "utf-8"
        }

    except PathSecurityError as e:
        logger.warning(f"Security violation in read_file: {e}")
        return {"error": str(e)}
    except UnicodeDecodeError:
        return {"error": f"File is not valid UTF-8 text: {path}"}
    except Exception as e:
        logger.error(f"Error reading file: {e}", exc_info=True)
        return {"error": f"Failed to read file: {str(e)}"}


async def write_file(
    path: str,
    content: str,
    create: bool = True,
    overwrite: bool = True
) -> Dict[str, Any]:
    """
    Write content to a file.

    Args:
        path: Relative path from workspace root
        content: Content to write
        create: Create file if it doesn't exist
        overwrite: Overwrite file if it exists

    Returns:
        Dict with success status or error
    """
    workspace_root = Path(settings.WORKSPACE_ROOT).resolve()

    try:
        file_path = validate_path(path, workspace_root)

        # Check if file exists
        file_exists = file_path.exists()

        if file_exists and not overwrite:
            return {"error": f"File already exists and overwrite=False: {path}"}

        if not file_exists and not create:
            return {"error": f"File does not exist and create=False: {path}"}

        # Ensure parent directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Validate content is text (no binary)
        if '\x00' in content:
            return {"error": "Binary content not allowed"}

        # Write file
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(content)

        return {
            "path": path,
            "size": len(content),
            "created": not file_exists,
            "success": True
        }

    except PathSecurityError as e:
        logger.warning(f"Security violation in write_file: {e}")
        return {"error": str(e)}
    except Exception as e:
        logger.error(f"Error writing file: {e}", exc_info=True)
        return {"error": f"Failed to write file: {str(e)}"}
