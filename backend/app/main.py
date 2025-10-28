# === CORE FILE ===
# DO NOT MODIFY
# Purpose: initialize the FastAPI app, configure CORS, and define core file/git endpoints.

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .git_utils import ensure_repo, commit_all, latest_diff
import os

"""
TODO: Authentication Integration
1. Import and set up authentication components:
   - Import auth router
   - Import database models and engine
   - Initialize database tables
   - Include auth router in app

2. Requirements:
   - User authentication with JWT
   - Protected endpoints for user data
   - Database integration for user storage
"""

app = FastAPI(title="DevSync Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKDIR = os.path.abspath(os.environ.get("DEVSYNC_WORKDIR", "./workspace"))
FILES_DIR = os.path.join(WORKDIR, "files")
os.makedirs(FILES_DIR, exist_ok=True)
ensure_repo(WORKDIR)

class FileWrite(BaseModel):
    path: str
    content: str

@app.get("/files")
def list_files():
    paths = []
    for root, _, files in os.walk(FILES_DIR):
        for f in files:
            p = os.path.relpath(os.path.join(root, f), FILES_DIR)
            paths.append(p)
    return {"files": paths}

@app.get("/file")
def read_file(path: str):
    abs_path = os.path.join(FILES_DIR, path)
    if not os.path.isfile(abs_path):
        raise HTTPException(404, "File not found")
    with open(abs_path, "r", encoding="utf-8") as fh:
        return {"path": path, "content": fh.read()}

@app.post("/file")
def write_file(req: FileWrite):
    abs_path = os.path.join(FILES_DIR, req.path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "w", encoding="utf-8") as fh:
        fh.write(req.content)
    return {"ok": True}

@app.post("/git/commit")
def git_commit(message: str = "save"):
    commit_id = commit_all(WORKDIR, message)
    return {"commit": commit_id}

@app.get("/git/diff")
def git_diff():
    return {"diff": latest_diff(WORKDIR)}
