# DevSync Backend

A complete, production-ready backend for a collaborative IDE platform with real-time sync, terminal streaming, and AI assistance.

## Features

- **Project & File Management**: Full CRUD operations with path sanitization and streaming for large files
- **Real-Time Collaboration**: Yjs-powered CRDT sync over WebSocket
- **Terminal Streaming**: node-pty integration with Windows/Unix support
- **AI Assistant**: OpenAI integration with context awareness and rate limiting
- **Extensions System**: Sandboxed extensions with worker threads
- **Performance Optimized**: Caching, debouncing, connection pooling

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **WebSocket**: ws + y-websocket
- **Database**: SQLite (better-sqlite3)
- **Terminal**: node-pty
- **Logging**: winston
- **Validation**: zod

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=8787
FRONTEND_URL=http://localhost:5173
AI_API_KEY=sk-your-openai-key
WORKSPACE_DIR=./workspace
DATABASE_PATH=./database.db
NODE_ENV=development
AI_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo
```

## Running

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id/tree` - Get directory tree

### Files
- `GET /api/files?path=...` - Read file
- `PUT /api/files` - Update file (body: `{path, content}`)
- `POST /api/files` - Create file (body: `{path, content?, isDirectory?}`)
- `DELETE /api/files?path=...` - Delete file

### Search
- `GET /api/search?projectId=...&q=...` - Search files and content

### Terminal
- `POST /api/terminal/start` - Create terminal session → `{sessionId}`
- `WS terminal:<sessionId>` - Connect to terminal stream

### AI Assistant
- `POST /api/ai/chat` - Chat with AI (body: `{message, context?}`)

### Extensions
- `GET /extensions/manifest.json` - List available extensions

## WebSocket Channels

Connect to `ws://localhost:8787/ws?channel=<type>&user=<userId>`

Channels:
- `presence` - User join/leave events
- `collab:<fileId>` - Real-time collaborative editing via Yjs
- `terminal:<sessionId>` - Terminal I/O streaming

## Performance Targets

| Metric | Target |
|--------|--------|
| File Load | < 200ms (1MB) |
| Save Latency | < 150ms |
| WS Broadcast | < 100ms |
| Concurrent Users | 25+ |
| Terminal Start | < 1s |
| AI Response | < 2s |
| Memory Usage | < 500MB |

## Security

- Path traversal protection (no `../`)
- Input validation with zod schemas
- Rate limiting on AI endpoints (3 req/min)
- Secret sanitization in AI context
- Dangerous terminal commands blocked
- CORS restricted to frontend URL

## Directory Structure

```
backend/
├── server.js              # Main entry point
├── config/
│   └── config.js          # Environment configuration
├── routes/                # Express route definitions
├── controllers/           # Request handlers
├── services/              # Business logic
├── ws/                    # WebSocket server
├── utils/                 # Logging, validation
├── extensions/            # Extension scripts
├── ai/                    # AI service integration
└── models/                # Database schema
```

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console (development only)

## Testing

Acceptance tests:
1. Load project tree: `GET /api/projects/demo/tree`
2. Edit file in two browsers, verify sync
3. Start terminal, execute `dir`/`ls`
4. Send AI chat message with context
5. Create/delete file, verify tree update
6. Check presence updates on join/leave

## Troubleshooting

**Terminal not working on Windows**: Ensure node-pty is properly compiled for Windows. May require `windows-build-tools`.

**AI not responding**: Check `AI_API_KEY` is set correctly and has credits.

**WebSocket disconnect**: Check firewall settings and ensure frontend URL matches CORS config.

## License

MIT
