# DevSync Production-Ready Quick Start

## 🚀 5-Minute Setup

### 1. Install Redis (Optional)

**Docker** (Recommended):
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Or Skip**: System works without Redis (in-memory fallback)

### 2. Backend Setup

```bash
cd backend

# Create environment file
cp .env.example .env

# IMPORTANT: Edit .env and change:
# JWT_SECRET_KEY=your-super-secret-random-string

# Dependencies already installed:
# pip install pyjwt redis aioredis slowapi

# Start server
python main.py
```

**Backend runs on**: http://localhost:8787

### 3. Frontend Setup

```bash
cd frontend

# Dependencies already installed:
# npm install yjs y-websocket y-protocols lib0

# Start dev server
npm run dev
```

**Frontend runs on**: http://localhost:3000

### 4. Test It!

1. **Open DevSync**: http://localhost:3000
2. **Login**: Use `demo` / `demo123`
3. **Create Session**: Click Users icon → Start New Session
4. **Copy Session ID**
5. **Open Second Browser**: Incognito/different browser
6. **Login**: Use `alice` / `alice123`
7. **Join Session**: Paste session ID
8. **Open Same File**: Both users
9. **Type Together**: Watch real-time sync!

## 📋 Demo Accounts

| Username | Password |
|----------|----------|
| demo     | demo123  |
| alice    | alice123 |
| bob      | bob123   |

## 🔑 API Endpoints

### Authentication

```bash
# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Register
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"user@example.com","password":"pass123"}'

# Get profile
curl http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Collaboration

```bash
# List active rooms
curl http://localhost:8787/api/collaboration/yjs/rooms

# Get room details
curl http://localhost:8787/api/collaboration/yjs/rooms/ROOM_ID
```

## ⚙️ Environment Variables

### Backend (`.env`)

**Required**:
```env
JWT_SECRET_KEY=change-this-in-production
```

**Optional**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=8787
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
NEXT_PUBLIC_AUTH_ENABLED=true
```

## 🔍 Verify Setup

### Check Backend Health
```bash
curl http://localhost:8787/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "workspace": "./workspace"
}
```

### Check Redis Connection

Look for in backend logs:
```
✓ Connected to Redis at localhost:6379
```

Or:
```
⚠ Redis connection failed: ...
⚠ Running without Redis - sessions will be in-memory only
```
(Both are fine - system works either way!)

### Check Authentication

```bash
# Should return token
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' | jq .access_token
```

## 🎯 Features

✅ **Yjs CRDT** - Conflict-free collaborative editing
✅ **JWT Auth** - Secure token-based authentication
✅ **Redis** - Persistent session storage (optional)
✅ **Rate Limiting** - DoS protection
✅ **Real-time Sync** - See changes as they happen
✅ **User Presence** - Know who's online
✅ **Chat** - Built-in messaging

## 🐛 Troubleshooting

### "Module not found: yjs"
```bash
cd frontend && npm install yjs y-websocket y-protocols lib0
```

### "Module 'pyjwt' has no attribute"
```bash
cd backend && pip install pyjwt redis aioredis slowapi
```

### Redis Connection Failed
This is just a warning! System works without Redis.

To enable Redis:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 401 Unauthorized
Your token expired. Login again or use refresh token.

### 429 Too Many Requests
Rate limit exceeded. Wait 60 seconds or restart backend (dev only).

## 📚 Full Documentation

- **[PRODUCTION_READY_GUIDE.md](PRODUCTION_READY_GUIDE.md)** - Complete guide
- **[PRODUCTION_UPGRADE_SUMMARY.md](PRODUCTION_UPGRADE_SUMMARY.md)** - What changed
- **[COLLABORATION_GUIDE.md](COLLABORATION_GUIDE.md)** - Original docs
- **[test-collaboration.md](test-collaboration.md)** - Testing guide

## 🚢 Deploy to Production

Before deploying:

1. ✅ Change `JWT_SECRET_KEY` to random string
2. ✅ Set up Redis server
3. ✅ Use HTTPS/WSS (not HTTP/WS)
4. ✅ Configure CORS for your domain
5. ✅ Set up monitoring
6. ✅ Load test
7. ✅ Security audit

See **[PRODUCTION_READY_GUIDE.md](PRODUCTION_READY_GUIDE.md)** for detailed deployment instructions.

---

**That's it! You're ready to collaborate! 🎉**
