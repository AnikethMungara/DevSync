"""
Git integration router for DevSync IDE.
Provides endpoints for Git operations like status, staging, commits, push/pull.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import subprocess
import os
from pathlib import Path

router = APIRouter()

# Get workspace root from environment or use default
WORKSPACE_ROOT = os.getenv("WORKSPACE_ROOT", "./workspace")


class GitStatusResponse(BaseModel):
    """Git repository status"""
    branch: str
    ahead: int
    behind: int
    staged: List[str]
    unstaged: List[str]
    untracked: List[str]


class StageFilesRequest(BaseModel):
    """Request to stage files"""
    files: List[str]


class CommitRequest(BaseModel):
    """Request to create a commit"""
    message: str


def run_git_command(args: List[str], cwd: str = None) -> tuple[str, str, int]:
    """
    Run a git command and return (stdout, stderr, returncode).

    Args:
        args: Git command arguments (e.g., ["status", "--porcelain"])
        cwd: Working directory (defaults to workspace root)

    Returns:
        Tuple of (stdout, stderr, returncode)
    """
    if cwd is None:
        cwd = WORKSPACE_ROOT

    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Git command timed out")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Git is not installed or not in PATH")


def check_git_repo():
    """Check if the workspace is a git repository"""
    stdout, stderr, returncode = run_git_command(["rev-parse", "--git-dir"])
    if returncode != 0:
        raise HTTPException(status_code=400, detail="Not a git repository")


@router.get("/status", response_model=GitStatusResponse)
async def get_git_status():
    """
    Get current Git status including branch, staged/unstaged files, and sync status.
    """
    check_git_repo()

    # Get current branch
    branch_stdout, _, branch_code = run_git_command(["rev-parse", "--abbrev-ref", "HEAD"])
    branch = branch_stdout.strip() if branch_code == 0 else "unknown"

    # Get ahead/behind counts
    ahead = 0
    behind = 0
    rev_list_stdout, _, rev_list_code = run_git_command([
        "rev-list", "--left-right", "--count", f"HEAD...@{{upstream}}"
    ])
    if rev_list_code == 0 and rev_list_stdout.strip():
        parts = rev_list_stdout.strip().split()
        if len(parts) == 2:
            ahead = int(parts[0])
            behind = int(parts[1])

    # Get file status using porcelain format
    status_stdout, _, _ = run_git_command(["status", "--porcelain"])

    staged = []
    unstaged = []
    untracked = []

    for line in status_stdout.splitlines():
        if len(line) < 3:
            continue

        index_status = line[0]  # Staging area status
        worktree_status = line[1]  # Working tree status
        filepath = line[3:].strip()

        # Parse status codes
        # X = index status, Y = worktree status
        # ' ' = unmodified, M = modified, A = added, D = deleted, R = renamed, C = copied
        # U = unmerged, ? = untracked, ! = ignored

        if index_status == '?' and worktree_status == '?':
            # Untracked file
            untracked.append(filepath)
        elif index_status != ' ' and index_status != '?':
            # Staged change
            staged.append(filepath)
        elif worktree_status != ' ' and worktree_status != '?':
            # Unstaged change
            unstaged.append(filepath)

    return GitStatusResponse(
        branch=branch,
        ahead=ahead,
        behind=behind,
        staged=staged,
        unstaged=unstaged,
        untracked=untracked
    )


@router.post("/stage")
async def stage_files(request: StageFilesRequest):
    """
    Stage files for commit.
    """
    check_git_repo()

    if not request.files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Stage each file
    for filepath in request.files:
        stdout, stderr, returncode = run_git_command(["add", filepath])
        if returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to stage {filepath}: {stderr}"
            )

    return {"status": "ok", "staged": request.files}


@router.post("/unstage")
async def unstage_files(request: StageFilesRequest):
    """
    Unstage files (remove from staging area).
    """
    check_git_repo()

    if not request.files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Unstage each file using 'git restore --staged'
    for filepath in request.files:
        stdout, stderr, returncode = run_git_command(["restore", "--staged", filepath])
        if returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to unstage {filepath}: {stderr}"
            )

    return {"status": "ok", "unstaged": request.files}


@router.post("/commit")
async def commit_changes(request: CommitRequest):
    """
    Create a commit with the given message.
    """
    check_git_repo()

    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Commit message cannot be empty")

    # Create commit
    stdout, stderr, returncode = run_git_command(["commit", "-m", request.message])

    if returncode != 0:
        # Check if there are no changes to commit
        if "nothing to commit" in stdout or "nothing to commit" in stderr:
            raise HTTPException(status_code=400, detail="Nothing to commit")
        raise HTTPException(
            status_code=500,
            detail=f"Commit failed: {stderr or stdout}"
        )

    return {"status": "ok", "message": "Commit created successfully"}


@router.post("/push")
async def push_changes():
    """
    Push commits to the remote repository.
    """
    check_git_repo()

    # Push to upstream
    stdout, stderr, returncode = run_git_command(["push"])

    if returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Push failed: {stderr or stdout}"
        )

    return {"status": "ok", "message": "Pushed successfully"}


@router.post("/pull")
async def pull_changes():
    """
    Pull changes from the remote repository.
    """
    check_git_repo()

    # Pull from upstream
    stdout, stderr, returncode = run_git_command(["pull"])

    if returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Pull failed: {stderr or stdout}"
        )

    return {"status": "ok", "message": "Pulled successfully"}


@router.get("/branches")
async def get_branches():
    """
    Get list of all branches.
    """
    check_git_repo()

    # Get all branches
    stdout, stderr, returncode = run_git_command(["branch", "-a"])

    if returncode != 0:
        raise HTTPException(status_code=500, detail=f"Failed to get branches: {stderr}")

    branches = []
    current_branch = None

    for line in stdout.splitlines():
        line = line.strip()
        if line.startswith("* "):
            # Current branch
            current_branch = line[2:].strip()
            branches.append(current_branch)
        elif line:
            branches.append(line.strip())

    return {
        "branches": branches,
        "current": current_branch
    }
