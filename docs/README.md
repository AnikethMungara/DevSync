# DevSync Documentation

## Getting Started

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide

## Production Deployment

- **[PRODUCTION_READY_GUIDE.md](PRODUCTION_READY_GUIDE.md)** - Complete production deployment guide
- **[PRODUCTION_UPGRADE_SUMMARY.md](PRODUCTION_UPGRADE_SUMMARY.md)** - What changed in the upgrade

## Features

- **[COLLABORATION_GUIDE.md](COLLABORATION_GUIDE.md)** - Collaborative editing documentation
- **[test-collaboration.md](test-collaboration.md)** - Testing collaborative features

## Quick Reference

### Demo Accounts
- `demo` / `demo123`
- `alice` / `alice123`
- `bob` / `bob123`

### API Endpoints
- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Collaboration**: `/api/collaboration/yjs/{session}/ws`
- **Health**: `/health`

### Environment Setup
```bash
# Backend
cd backend
cp .env.example .env
python main.py

# Frontend
cd frontend
npm run dev
```
