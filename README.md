# DevSync - Collaborative IDE

A real-time collaborative IDE with file management, code editing, and AI assistance.

## Features

- ✅ **File Explorer with CRUD Operations** - Create, read, update, delete files and folders with context menus
- ✅ **Live Code Editor** - Edit files with auto-save (2-second debounce) and manual save (Ctrl+S)
- ✅ **Database Persistence** - SQLite backend with automatic synchronization
- ✅ **Visual Feedback** - Unsaved changes indicators, save buttons, and toast notifications
- ✅ **Real-time Collaboration** - WebSocket-based collaborative editing (Yjs CRDT)
- ✅ **AI Assistant** - Integrated AI chat for coding help
- ✅ **Modern UI** - Next.js 16 + React 19 with Tailwind CSS v4

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:8787
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database Migration
If you're upgrading from an older version:
```bash
cd backend
node migrate-files-table.js
```

## Documentation

- [CRUD Implementation Guide](CRUD_IMPLEMENTATION.md) - File explorer CRUD system implementation
- [Frontend-Backend Integration](FRONTEND_BACKEND_INTEGRATION.md) - Editor integration with auto-save and database sync

## Tech Stack

**Backend**
- Node.js + Express
- SQLite (better-sqlite3)
- WebSocket (Yjs for CRDT)
- JWT authentication

**Frontend**
- Next.js 16 + React 19
- TypeScript
- Zustand (state management)
- Tailwind CSS v4
- Lucide React (icons)

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/files/tree` | Get file tree structure |
| GET | `/api/files?path=<path>` | Read file content |
| POST | `/api/files` | Create file or folder |
| PUT | `/api/files` | Update file content |
| DELETE | `/api/files?path=<path>` | Delete file or folder |
| PATCH | `/api/files/rename` | Rename/move file or folder |

## License

MIT
**DevSync**





**Description**

DevSync is a collaborative development environment that integrates real-time editing, built-in version control, and AI-assisted programming.
It is designed to serve as a unified workspace where developers can code together, track changes, and access contextual code intelligence without relying on third-party repository hosting platforms.
The system architecture emphasizes modularity and performance, separating backend and frontend layers to ensure clarity of design, scalability, and extensibility.

**Technologies**


**Backend**

Language: Python 3.10+

Framework: FastAPI — provides an asynchronous, high-performance REST and WebSocket API layer.

Server: Uvicorn — lightweight ASGI server used to host the FastAPI application.

ORM: SQLAlchemy — defines data models and manages persistence.

Database: SQLite for local development; configurable for PostgreSQL during deployment.

Version Control Engine: GitPython — integrates Git-like functionality directly into the backend to handle repository initialization, commit creation, and history tracking.

AI Integration Layer: Designed for pluggable model access through external APIs such as Gemini or OpenAI, or local models served through Ollama.

WebSocket Communication: Enables live session synchronization, shared editing, and collaborative state updates between connected clients.

Configuration Management: Environment variables handled through a simple configuration module in app/core/config.py.

**Frontend**

Language: JavaScript (ES Modules) with React 18+.

Build Tool: Vite — fast development and build environment optimized for modern JavaScript applications.

Editor Component: Monaco Editor — provides an extensible, VS Code–like in-browser coding interface.

Styling: Tailwind CSS (optional) for responsive layout and component consistency.

State Management: Local component state with React Hooks; expandable to Context API or Redux for multi-session coordination.

Networking: Native Fetch API or Axios for REST calls to the FastAPI backend.

Realtime Features: WebSocket client for live collaboration and multi-cursor editing.

**Infrastructure and Tooling** 

Package Management: pip for backend dependencies; npm for frontend.

Version Control: Git (local and integrated through GitPython).

Deployment Targets: Render or Railway for backend hosting; Vercel for frontend distribution; Neon or Supabase for managed PostgreSQL databases.

Testing and Quality: PyTest for backend testing, ESLint and Prettier for code style enforcement.

Environment Configuration: .env files for local setup, mirrored by environment variables in deployment environments.

**Purpose**

DevSync demonstrates the design of a self-contained, cloud-ready development platform that combines collaboration, automation, and intelligent assistance into a single interface.
It is intended as a foundation for experimentation, extension, and deployment of integrated development tools built around modern web and AI technologies.
