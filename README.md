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
