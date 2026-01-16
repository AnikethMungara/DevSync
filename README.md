# DevSync

Real-time collaborative IDE with AI assistance.

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env  #  Set JWT_SECRET_KEY
python main.py        #  Runs on :8787
```

### Frontend
```bash
cd frontend
npm install
npm run dev           #  Runs on :3000
```

## Features

- Real-time collaborative editing (Yjs CRDT)
- JWT authentication
- AI-powered coding assistant
- Built-in terminal and file management
- Git integration

## Demo Accounts

- `demo` / `demo123`
- `alice` / `alice123`
- `bob` / `bob123`

## Documentation

See [docs/](docs/) folder for detailed guides.

## Tech Stack

**Frontend**: Next.js 16, React 19, TypeScript, Yjs
**Backend**: FastAPI, Python 3.12, WebSockets, Redis

## License

MIT
