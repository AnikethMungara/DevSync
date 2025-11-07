"""
Checkpoint router for project version control.
Allows creating snapshots of the project and reverting to them.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import shutil
from datetime import datetime
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Get workspace root from environment or use default
WORKSPACE_ROOT = os.getenv("WORKSPACE_ROOT", "./workspace")
CHECKPOINTS_DIR = os.path.join(WORKSPACE_ROOT, ".checkpoints")
MAX_CHECKPOINTS = 3


class CreateCheckpointRequest(BaseModel):
    """Request to create a checkpoint"""
    name: str
    description: Optional[str] = ""


class Checkpoint(BaseModel):
    """Checkpoint information"""
    id: str
    name: str
    description: str
    created_at: str
    file_count: int
    size_bytes: int


class CheckpointListResponse(BaseModel):
    """Response with list of checkpoints"""
    checkpoints: List[Checkpoint]
    max_checkpoints: int


class RevertResponse(BaseModel):
    """Response after reverting to checkpoint"""
    success: bool
    message: str
    checkpoint_id: str
    files_restored: int


def ensure_checkpoints_dir():
    """Ensure checkpoints directory exists"""
    os.makedirs(CHECKPOINTS_DIR, exist_ok=True)

    # Create .gitignore to exclude checkpoints from git
    gitignore_path = os.path.join(CHECKPOINTS_DIR, ".gitignore")
    if not os.path.exists(gitignore_path):
        with open(gitignore_path, "w") as f:
            f.write("# Exclude all checkpoint data from git\n*\n!.gitignore\n")


def get_checkpoint_path(checkpoint_id: str) -> str:
    """Get the directory path for a checkpoint"""
    return os.path.join(CHECKPOINTS_DIR, checkpoint_id)


def get_checkpoint_metadata_path(checkpoint_id: str) -> str:
    """Get the metadata file path for a checkpoint"""
    return os.path.join(get_checkpoint_path(checkpoint_id), "metadata.json")


def get_directory_size(path: str) -> int:
    """Calculate total size of directory in bytes"""
    total = 0
    try:
        for entry in os.scandir(path):
            if entry.is_file():
                total += entry.stat().st_size
            elif entry.is_dir():
                total += get_directory_size(entry.path)
    except Exception:
        pass
    return total


def count_files(path: str) -> int:
    """Count number of files in directory"""
    count = 0
    try:
        for entry in os.scandir(path):
            if entry.is_file():
                count += 1
            elif entry.is_dir():
                count += count_files(entry.path)
    except Exception:
        pass
    return count


def should_exclude(path: str, base_path: str) -> bool:
    """Check if path should be excluded from checkpoint"""
    relative_path = os.path.relpath(path, base_path)

    # Exclude patterns
    exclude_patterns = [
        ".checkpoints",
        ".git",
        "node_modules",
        "__pycache__",
        ".venv",
        "venv",
        ".env",
        ".env.local",
        "*.pyc",
        "*.pyo",
        "*.pyd",
        ".DS_Store",
        "Thumbs.db",
        "*.log",
        "*.db",
        "*.sqlite",
        "*.sqlite3",
    ]

    for pattern in exclude_patterns:
        if pattern in relative_path:
            return True

    return False


def copy_workspace_to_checkpoint(checkpoint_path: str):
    """Copy workspace files to checkpoint directory"""
    data_path = os.path.join(checkpoint_path, "data")
    os.makedirs(data_path, exist_ok=True)

    copied_files = 0

    for root, dirs, files in os.walk(WORKSPACE_ROOT):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), WORKSPACE_ROOT)]

        for file in files:
            src_path = os.path.join(root, file)

            if should_exclude(src_path, WORKSPACE_ROOT):
                continue

            # Calculate relative path
            rel_path = os.path.relpath(src_path, WORKSPACE_ROOT)
            dst_path = os.path.join(data_path, rel_path)

            # Create destination directory
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)

            # Copy file
            try:
                shutil.copy2(src_path, dst_path)
                copied_files += 1
            except Exception as e:
                logger.warning(f"Failed to copy {src_path}: {e}")

    return copied_files


def restore_checkpoint_to_workspace(checkpoint_path: str):
    """Restore checkpoint files to workspace"""
    data_path = os.path.join(checkpoint_path, "data")

    if not os.path.exists(data_path):
        raise HTTPException(status_code=404, detail="Checkpoint data not found")

    restored_files = 0

    # Clear workspace (except excluded items)
    for item in os.listdir(WORKSPACE_ROOT):
        item_path = os.path.join(WORKSPACE_ROOT, item)
        if should_exclude(item_path, WORKSPACE_ROOT):
            continue

        try:
            if os.path.isfile(item_path):
                os.remove(item_path)
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)
        except Exception as e:
            logger.warning(f"Failed to remove {item_path}: {e}")

    # Restore files from checkpoint
    for root, dirs, files in os.walk(data_path):
        for file in files:
            src_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_path, data_path)
            dst_path = os.path.join(WORKSPACE_ROOT, rel_path)

            # Create destination directory
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)

            # Copy file
            try:
                shutil.copy2(src_path, dst_path)
                restored_files += 1
            except Exception as e:
                logger.warning(f"Failed to restore {src_path}: {e}")

    return restored_files


def cleanup_old_checkpoints():
    """Remove oldest checkpoints if exceeding MAX_CHECKPOINTS"""
    ensure_checkpoints_dir()

    checkpoints = []
    for item in os.listdir(CHECKPOINTS_DIR):
        if item == ".gitignore":
            continue

        checkpoint_path = os.path.join(CHECKPOINTS_DIR, item)
        if not os.path.isdir(checkpoint_path):
            continue

        metadata_path = get_checkpoint_metadata_path(item)
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                    checkpoints.append((item, metadata["created_at"]))
            except Exception:
                pass

    # Sort by creation time (oldest first)
    checkpoints.sort(key=lambda x: x[1])

    # Remove oldest checkpoints if exceeding limit
    while len(checkpoints) > MAX_CHECKPOINTS:
        checkpoint_id, _ = checkpoints.pop(0)
        checkpoint_path = get_checkpoint_path(checkpoint_id)
        try:
            shutil.rmtree(checkpoint_path)
            logger.info(f"Removed old checkpoint: {checkpoint_id}")
        except Exception as e:
            logger.error(f"Failed to remove checkpoint {checkpoint_id}: {e}")


@router.post("/create", response_model=Checkpoint)
async def create_checkpoint(request: CreateCheckpointRequest):
    """
    Create a new checkpoint of the current workspace.

    Automatically removes oldest checkpoint if max limit is reached.
    """
    ensure_checkpoints_dir()

    # Generate checkpoint ID (timestamp-based)
    checkpoint_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    checkpoint_path = get_checkpoint_path(checkpoint_id)

    try:
        # Create checkpoint directory
        os.makedirs(checkpoint_path, exist_ok=True)

        # Copy workspace files
        file_count = copy_workspace_to_checkpoint(checkpoint_path)

        # Calculate checkpoint size
        size_bytes = get_directory_size(os.path.join(checkpoint_path, "data"))

        # Create metadata
        created_at = datetime.now().isoformat()
        metadata = {
            "id": checkpoint_id,
            "name": request.name,
            "description": request.description,
            "created_at": created_at,
            "file_count": file_count,
            "size_bytes": size_bytes,
        }

        # Save metadata
        metadata_path = get_checkpoint_metadata_path(checkpoint_id)
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        # Cleanup old checkpoints
        cleanup_old_checkpoints()

        return Checkpoint(**metadata)

    except Exception as e:
        # Cleanup on failure
        if os.path.exists(checkpoint_path):
            shutil.rmtree(checkpoint_path)

        logger.error(f"Failed to create checkpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkpoint: {str(e)}"
        )


@router.get("/list", response_model=CheckpointListResponse)
async def list_checkpoints():
    """
    List all available checkpoints, sorted by creation time (newest first).
    """
    ensure_checkpoints_dir()

    checkpoints = []

    for item in os.listdir(CHECKPOINTS_DIR):
        if item == ".gitignore":
            continue

        checkpoint_path = os.path.join(CHECKPOINTS_DIR, item)
        if not os.path.isdir(checkpoint_path):
            continue

        metadata_path = get_checkpoint_metadata_path(item)
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                    checkpoints.append(Checkpoint(**metadata))
            except Exception as e:
                logger.warning(f"Failed to read checkpoint metadata {item}: {e}")

    # Sort by creation time (newest first)
    checkpoints.sort(key=lambda x: x.created_at, reverse=True)

    return CheckpointListResponse(
        checkpoints=checkpoints,
        max_checkpoints=MAX_CHECKPOINTS
    )


@router.get("/{checkpoint_id}", response_model=Checkpoint)
async def get_checkpoint(checkpoint_id: str):
    """
    Get details of a specific checkpoint.
    """
    metadata_path = get_checkpoint_metadata_path(checkpoint_id)

    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    try:
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
            return Checkpoint(**metadata)
    except Exception as e:
        logger.error(f"Failed to read checkpoint {checkpoint_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read checkpoint: {str(e)}"
        )


@router.post("/{checkpoint_id}/revert", response_model=RevertResponse)
async def revert_to_checkpoint(checkpoint_id: str):
    """
    Revert workspace to a specific checkpoint.

    WARNING: This will replace all files in the workspace with the checkpoint version.
    """
    checkpoint_path = get_checkpoint_path(checkpoint_id)
    metadata_path = get_checkpoint_metadata_path(checkpoint_id)

    if not os.path.exists(checkpoint_path) or not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    try:
        # Restore checkpoint
        files_restored = restore_checkpoint_to_workspace(checkpoint_path)

        return RevertResponse(
            success=True,
            message=f"Successfully reverted to checkpoint '{checkpoint_id}'",
            checkpoint_id=checkpoint_id,
            files_restored=files_restored
        )

    except Exception as e:
        logger.error(f"Failed to revert to checkpoint {checkpoint_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to revert to checkpoint: {str(e)}"
        )


@router.delete("/{checkpoint_id}")
async def delete_checkpoint(checkpoint_id: str):
    """
    Delete a specific checkpoint.
    """
    checkpoint_path = get_checkpoint_path(checkpoint_id)

    if not os.path.exists(checkpoint_path):
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    try:
        shutil.rmtree(checkpoint_path)
        return {
            "success": True,
            "message": f"Checkpoint '{checkpoint_id}' deleted successfully"
        }
    except Exception as e:
        logger.error(f"Failed to delete checkpoint {checkpoint_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete checkpoint: {str(e)}"
        )
