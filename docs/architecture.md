# DevSync Architecture

## Overview
DevSync is a web-based IDE prototype with three core subsystems:
1. **Frontend (React + Monaco Editor)** — Code editing, diff viewing, AI suggestions UI, session presence.
2. **Backend (FastAPI)** — File ops, Git actions via `pygit2`, LLM proxy, session management.
3. **Collaboration Layer (Socket.IO)** — Real-time change broadcast between connected clients.

```
+--------------------------+
|        Frontend          |
|  React + Monaco + WS     |
|  - Editor                |
|  - Commits/Diffs panel   |
|  - AI Assistant panel    |
+------------+-------------+
             |
             | WebSocket (Socket.IO) + REST
             v
+------------+-------------+
|           Backend        |
|     FastAPI + Socket.IO  |
| - File APIs              |
| - Git (pygit2)           |
| - LLM proxy              |
| - Session mgr            |
+------------+-------------+
             |
             | Local FS + pygit2
             v
+------------+-------------+
|      Repo Workspace      |
| .devsync/ (metadata)     |
| files/ (project files)   |
+--------------------------+
```

## Key Endpoints
- `GET /files` — list files
- `GET /file?path=...` — read file
- `POST /file` — write file `{ path, content }`
- `POST /git/commit` — `{ message }`
- `GET /git/diff` — latest diff
- `POST /git/branch` — `{ name }`
- `POST /ai/complete` — `{ path, content, cursor }`

## Collaboration
- `ws: change` — broadcast small patches (line range + text)
- MVP uses last-write-wins; CRDT can be added later.

## Security
- Local-first prototype. For multi-user over network, add auth + sandboxing.
