# DevSync Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install

cd ../frontend/frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:

```bash
# Required for production
JWT_SECRET=your-random-secret-key-here

# Optional
JWT_EXPIRES_IN=7d
DB_PATH=./data/devsync.db
WORKSPACE_DIR=./workspace
PORT=8787

# Generate a secure JWT_SECRET:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Backend

```bash
cd backend
npm start

# Or with auto-reload:
npm run dev
```

Expected output:
```
[INFO] Database schema initialized successfully
[INFO] SQLite database initialized successfully
[INFO] DevSync backend listening on http://localhost:8787
[INFO] WebSocket server available at ws://localhost:8787/ws
```

### 4. Start Frontend

```bash
cd frontend/frontend
npm run dev
```

---

## First Time Setup

### Create Your First User

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "changeme123"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "is_active": 1,
    "created_at": "2025-01-15T12:00:00.000Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "changeme123"
  }'
```

Response:
```json
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save this token!** You'll need it for authenticated requests.

---

## API Reference

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login |
| `/api/auth/logout` | POST | Yes | Logout |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/auth/refresh` | POST | Yes | Refresh token |

### Projects

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/projects` | GET | Optional | List projects |
| `/api/projects/:id/tree` | GET | Optional | Get project file tree |

### Files

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/files?path=...` | GET | Optional | Read file |
| `/api/files` | PUT | Optional | Write file |
| `/api/files` | DELETE | Optional | Delete file |

### Code Execution

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/execution/run` | POST | Optional | Execute code |
| `/api/execution/languages` | GET | No | Get supported languages |

### Search

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/search?q=...&projectId=...` | GET | Optional | Search in files |

### AI Assistant

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/chat` | POST | Optional | Send message to AI |

### Terminal

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/terminal/sessions` | GET | Optional | List terminal sessions |

---

## Using Authentication in Requests

Add the `Authorization` header to all authenticated requests:

```bash
curl http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript Example

```javascript
const API_URL = 'http://localhost:8787';
const token = localStorage.getItem('authToken');

async function fetchWithAuth(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}

// Usage
const user = await fetchWithAuth('/api/auth/me');
console.log(user);
```

---

## Code Execution Examples

### JavaScript

```bash
curl -X POST http://localhost:8787/api/execution/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"Hello World\"); console.log(2+2);",
    "language": "javascript"
  }'
```

### Python

```bash
curl -X POST http://localhost:8787/api/execution/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello from Python\"); print(3+4)",
    "language": "python"
  }'
```

Response:
```json
{
  "success": true,
  "result": {
    "stdout": "Hello World\n4\n",
    "stderr": "",
    "exitCode": 0,
    "success": true
  }
}
```

---

## Database

### Location
`backend/data/devsync.db`

### Schema
- **users** - User accounts
- **projects** - Projects
- **project_members** - Collaboration
- **files** - File metadata
- **sessions** - Active sessions
- **execution_history** - Code execution logs

### Direct Access (SQLite CLI)

```bash
sqlite3 backend/data/devsync.db

# List all users
SELECT * FROM users;

# List all projects
SELECT * FROM projects;

# Check active sessions
SELECT * FROM sessions WHERE expires_at > datetime('now');
```

---

## Common Tasks

### Reset Database

```bash
rm backend/data/devsync.db
# Restart backend - fresh database will be created
```

### Check Server Health

```bash
curl http://localhost:8787/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123.45
}
```

### View Logs

Logs are written to `backend/logs/` directory:
- `combined.log` - All logs
- `error.log` - Errors only

---

## Troubleshooting

### "Cannot find module 'better-sqlite3'"

```bash
cd backend
npm install
```

### "JWT_SECRET not set" warning

Add to `backend/.env`:
```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Port already in use

Change port in `backend/.env`:
```bash
PORT=8788
```

### Database locked

```bash
# Find and kill any process using the database
lsof backend/data/devsync.db
```

---

## What's New

### ✅ Real Database (SQLite)
- All data persists
- User accounts
- Projects
- Sessions

### ✅ Authentication
- JWT tokens
- bcrypt password hashing
- Session management

### ✅ Code Execution
- JavaScript via Node.js
- Python support
- Real-time output
- WebSocket broadcasting

### ✅ Unified Backend
- Single Express.js server
- No more FastAPI separation
- All features integrated

---

## Next Steps

1. **Add Frontend Auth UI** - Login/register pages
2. **Replace Mock APIs** - Use real backend calls
3. **Implement Linting** - Real problem detection
4. **Add AI Integration** - Connect to actual LLM
5. **Git Panel** - Commit, push, pull functionality

---

For detailed architecture information, see [ARCHITECTURE_UPDATE.md](ARCHITECTURE_UPDATE.md)

For code execution details, see [CODE_EXECUTION.md](CODE_EXECUTION.md)
