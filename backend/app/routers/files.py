"""File management endpoints"""
from fastapi import APIRouter, HTTPException, Query, Body, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
import aiofiles
import asyncio
from app.config import settings
from app.utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

# Write debounce queue
write_queue: Dict[str, asyncio.Task] = {}


class FileNode(BaseModel):
    """File tree node"""
    id: str
    name: str
    path: str
    type: str  # "file" or "folder"
    size: Optional[int] = None
    children: Optional[List['FileNode']] = None


class CreateFileRequest(BaseModel):
    """Request to create a file or directory"""
    path: str
    content: str = ""
    isDirectory: bool = False


class UpdateFileRequest(BaseModel):
    """Request to update file content"""
    path: str
    content: str


class RenameFileRequest(BaseModel):
    """Request to rename a file"""
    oldPath: str
    newPath: str


def get_workspace_path(relative_path: str = "") -> Path:
    """Get absolute workspace path from relative path"""
    workspace = Path(settings.WORKSPACE_DIR)
    if not relative_path:
        return workspace

    full_path = (workspace / relative_path).resolve()

    # Security: Prevent path traversal
    if not str(full_path).startswith(str(workspace.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path: path traversal detected")

    return full_path


async def build_file_tree(full_path: Path, relative_path: str = "") -> FileNode:
    """Recursively build file tree"""
    if not full_path.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {relative_path}")

    name = full_path.name or "workspace"
    node_id = relative_path or "root"

    if full_path.is_file():
        size = full_path.stat().st_size
        return FileNode(
            id=node_id,
            name=name,
            path=relative_path,
            type="file",
            size=size
        )

    # Directory
    children = []
    try:
        entries = sorted(full_path.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower()))

        for entry in entries:
            # Skip hidden files
            if entry.name.startswith('.'):
                continue

            child_relative = f"{relative_path}/{entry.name}" if relative_path else entry.name
            try:
                child_node = await build_file_tree(entry, child_relative)
                children.append(child_node)
            except Exception as e:
                logger.warning(f"Failed to build tree for {entry}: {e}")
                continue

    except PermissionError:
        logger.warning(f"Permission denied reading directory: {full_path}")

    return FileNode(
        id=node_id,
        name=name,
        path=relative_path,
        type="folder",
        children=children
    )


@router.get("/tree")
async def get_file_tree(path: str = Query("", description="Relative path from workspace")):
    """Get file tree structure"""
    try:
        full_path = get_workspace_path(path)

        # Ensure workspace exists
        if not full_path.exists():
            full_path.mkdir(parents=True, exist_ok=True)
            return FileNode(
                id="root",
                name="workspace",
                path="",
                type="folder",
                children=[]
            )

        tree = await build_file_tree(full_path, path)
        return tree

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error building file tree: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def read_file(path: str = Query(..., description="Relative path from workspace")):
    """Read file content"""
    try:
        full_path = get_workspace_path(path)

        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {path}")

        if not full_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {path}")

        # Read file content
        async with aiofiles.open(full_path, mode='r', encoding='utf-8') as f:
            content = await f.read()

        return {"content": content, "path": path}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading file {path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def write_file_debounced(full_path: Path, content: str, relative_path: str, request: Request):
    """Write file with debounce delay"""
    await asyncio.sleep(settings.WRITE_DEBOUNCE_MS / 1000.0)

    try:
        # Write file
        async with aiofiles.open(full_path, mode='w', encoding='utf-8') as f:
            await f.write(content)

        # Sync to database
        db = request.app.state.db
        size = full_path.stat().st_size
        await db.upsert_file(relative_path, content, size, None)

        logger.info(f"File updated: {relative_path}")

    except Exception as e:
        logger.error(f"Error writing file {relative_path}: {e}", exc_info=True)
    finally:
        # Remove from queue
        if relative_path in write_queue:
            del write_queue[relative_path]


@router.put("/")
async def update_file(request: Request, body: UpdateFileRequest):
    """Update file content"""
    try:
        full_path = get_workspace_path(body.path)

        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {body.path}")

        if not full_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {body.path}")

        # Cancel existing debounced write
        if body.path in write_queue:
            write_queue[body.path].cancel()

        # Schedule debounced write
        task = asyncio.create_task(
            write_file_debounced(full_path, body.content, body.path, request)
        )
        write_queue[body.path] = task

        return {"success": True, "path": body.path}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating file {body.path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_file(request: Request, body: CreateFileRequest):
    """Create a new file or directory"""
    try:
        full_path = get_workspace_path(body.path)

        if full_path.exists():
            raise HTTPException(status_code=400, detail=f"Path already exists: {body.path}")

        # Ensure parent directory exists
        full_path.parent.mkdir(parents=True, exist_ok=True)

        if body.isDirectory:
            # Create directory
            full_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Directory created: {body.path}")
        else:
            # Create file
            async with aiofiles.open(full_path, mode='w', encoding='utf-8') as f:
                await f.write(body.content)

            # Sync to database
            db = request.app.state.db
            size = full_path.stat().st_size
            await db.upsert_file(body.path, body.content, size, None)

            logger.info(f"File created: {body.path}")

        return {"success": True, "path": body.path}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating file {body.path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
async def delete_file(request: Request, path: str = Query(..., description="Relative path from workspace")):
    """Delete a file or directory"""
    try:
        full_path = get_workspace_path(path)

        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {path}")

        if full_path.is_dir():
            # Delete directory recursively
            import shutil
            await asyncio.to_thread(shutil.rmtree, full_path)
        else:
            # Delete file
            full_path.unlink()

            # Remove from database
            db = request.app.state.db
            await db.delete_file(path)

        logger.info(f"Deleted: {path}")
        return {"success": True, "path": path}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting {path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/rename")
async def rename_file(request: Request, body: RenameFileRequest):
    """Rename/move a file or directory"""
    try:
        old_full_path = get_workspace_path(body.oldPath)
        new_full_path = get_workspace_path(body.newPath)

        if not old_full_path.exists():
            raise HTTPException(status_code=404, detail=f"Source path not found: {body.oldPath}")

        if new_full_path.exists():
            raise HTTPException(status_code=400, detail=f"Destination path already exists: {body.newPath}")

        # Ensure parent directory exists for new path
        new_full_path.parent.mkdir(parents=True, exist_ok=True)

        # Rename/move
        old_full_path.rename(new_full_path)

        # Update database
        db = request.app.state.db
        await db.update_file_path(body.newPath, body.oldPath)

        logger.info(f"Renamed: {body.oldPath} -> {body.newPath}")
        return {"success": True, "oldPath": body.oldPath, "newPath": body.newPath}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming {body.oldPath} to {body.newPath}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
