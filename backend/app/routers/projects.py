"""Projects endpoints"""
from fastapi import APIRouter, HTTPException
from typing import List
from pathlib import Path
from app.config import settings
from app.routers.files import build_file_tree, get_workspace_path, FileNode
from app.utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)


@router.get("/")
async def list_projects():
    """List all projects in workspace"""
    try:
        workspace = Path(settings.WORKSPACE_DIR)

        if not workspace.exists():
            workspace.mkdir(parents=True, exist_ok=True)
            return []

        projects = []
        for entry in workspace.iterdir():
            if entry.is_dir() and not entry.name.startswith('.'):
                projects.append({
                    "id": entry.name,
                    "name": entry.name,
                    "path": entry.name,
                    "type": "folder"
                })

        logger.info(f"Listed {len(projects)} projects")
        return projects

    except Exception as e:
        logger.error(f"Error listing projects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/tree")
async def get_project_tree(project_id: str):
    """Get file tree for a specific project"""
    try:
        full_path = get_workspace_path(project_id)

        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"Project not found: {project_id}")

        if not full_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {project_id}")

        tree = await build_file_tree(full_path, project_id)
        return tree

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project tree for {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
