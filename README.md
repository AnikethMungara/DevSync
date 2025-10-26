# DevSync — AI-Powered Collaborative IDE

DevSync is a **web-based collaborative code editor** that integrates:
- **Local-first Git workflows** (no GitHub required) via `pygit2`
- **Real-time collaboration** using WebSockets (Socket.IO)
- **LLM-powered code assistance** (tab completion + "explain this" actions)
- **Self-hosted** via Docker

> MVP focus: Resume-ready prototype demonstrating full-stack system design (React + FastAPI + Socket.IO + LLM + Git).

## Architecture
See [`docs/architecture.md`](docs/architecture.md).

## Quick start (local)
```bash
# 1) Backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000

# 2) Frontend
cd frontend
npm install
npm run dev  # Vite dev server (default: http://localhost:5173)
```

## Docker (optional)
```bash
docker compose up --build
```

## Development log
See [`DEVLOG.md`](DEVLOG.md).

## Roadmap
See [`docs/roadmap.md`](docs/roadmap.md).

## License
MIT (replace as needed).
