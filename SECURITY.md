# Security Guide

## 🔐 Protecting Your API Keys and Sensitive Data

This guide explains how DevSync protects your sensitive information and what you need to do to keep your data secure.

## Protected Files (Already in .gitignore)

The following files are **automatically ignored** by Git and will never be committed:

### Environment Files
```
.env
.env.*
backend/.env
backend/.env.*
frontend/.env.local
frontend/.env.*
agent-service/.env
```

### API Keys and Credentials
```
**/api-keys.txt
**/secrets.json
**/credentials.json
*.key
*.pem
*.p12
*.pfx
```

### Virtual Environments
```
venv/
.venv/
backend/venv/
agent-service/venv/
**/venv/
```

### Databases
```
*.db
*.sqlite
*.sqlite3
database.db
backend/database.db
```

### Session Data
```
**/sessions.json
**/collaboration-sessions.json
user-sessions/
active-sessions/
```

## Safe Example Files (CAN be committed)

These files are safe to commit and serve as templates:

- `backend/.env.example` - Template for backend configuration
- `frontend/.env.local.example` - Template for frontend configuration
- `README.md` - Documentation
- `*.md` files - Documentation

## Setting Up Your Environment

### First Time Setup

1. **Copy example files**:
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend (optional, for network access)
   cp frontend/.env.local.example frontend/.env.local
   ```

2. **Add your API keys** to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
   ANTHROPIC_API_KEY=sk-ant-YOUR-ACTUAL-KEY-HERE
   GOOGLE_API_KEY=YOUR-ACTUAL-KEY-HERE
   ```

3. **Never commit** the actual `.env` files!

## Checking What Will Be Committed

Before committing, always verify no sensitive files are included:

```bash
# See what will be committed
git status

# See detailed diff
git diff --staged

# Check if .env is ignored
git check-ignore backend/.env
# Should output: backend/.env
```

## If You Accidentally Commit Secrets

### ⚠️ IMMEDIATE ACTION REQUIRED

If you accidentally commit API keys or secrets:

1. **Rotate ALL exposed keys immediately**:
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys
   - Google: https://aistudio.google.com/app/apikey

2. **Remove from Git history**:
   ```bash
   # Remove file from history (CAREFUL!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all

   # Or use BFG Repo-Cleaner (easier)
   # https://reps.github.io/bfg-repo-cleaner/
   ```

3. **Force push** (if already pushed to remote):
   ```bash
   git push origin --force --all
   ```

4. **Notify team members** to re-clone the repository

## Best Practices

### ✅ DO

- **Use .env.example files** as templates
- **Keep .env files local** on your machine only
- **Rotate keys regularly** (every 90 days recommended)
- **Use different keys** for development and production
- **Review git status** before committing
- **Use environment-specific configurations**

### ❌ DON'T

- **Never commit .env files** with real keys
- **Never hardcode secrets** in source code
- **Never share API keys** via chat/email
- **Never push venv/ directories** to Git
- **Never commit database files** with user data
- **Never disable .gitignore** for these files

## Secure Development Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] Virtual environments (`venv/`) are in `.gitignore`
- [ ] Database files (`*.db`) are in `.gitignore`
- [ ] Example files (`.env.example`) are safe and committed
- [ ] Real API keys are in `.env` (not `.env.example`)
- [ ] Frontend `.env.local` is in `.gitignore`
- [ ] `git status` shows no sensitive files
- [ ] Teammates have their own API keys

## Network Security

### Development Mode (Current Setup)

- ✅ CORS allows local network access
- ✅ Suitable for trusted home/office networks
- ⚠️ **NOT production-ready**

### For Production Deployment

Add these security measures:

1. **HTTPS/TLS Encryption**:
   ```python
   # Use HTTPS certificates
   # Update FRONTEND_URL to https://
   ```

2. **Authentication**:
   - Add user authentication
   - JWT tokens for API access
   - Session management

3. **API Key Protection**:
   - Use environment variables
   - Never expose in frontend
   - Rotate regularly

4. **CORS Restrictions**:
   ```python
   # Restrict to specific origins
   allow_origins=["https://yourdomain.com"]
   ```

5. **Rate Limiting**:
   - Prevent abuse
   - Protect AI API quota

6. **Network Security**:
   - Firewall rules
   - VPN for remote access
   - Security groups

## Collaboration Security

When using real-time collaboration:

- ✅ Sessions are ephemeral (deleted when users leave)
- ✅ Session IDs are random UUIDs
- ⚠️ No authentication currently (trust-based)
- ⚠️ All session members can see all activity

**For trusted teams only** - add authentication before using with untrusted users.

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to the maintainer
3. Include detailed description and steps to reproduce
4. Allow time for fix before public disclosure

## Environment Variable Reference

### Required for AI Features
- `OPENAI_API_KEY` - OpenAI GPT models
- `ANTHROPIC_API_KEY` - Anthropic Claude models
- `GOOGLE_API_KEY` - Google Gemini models

### Network Configuration
- `FRONTEND_URL` - Where frontend is hosted
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (frontend)

### Never Required to Commit
- All `.env` files
- All `*.key` files
- All credential files
- Database files
- Virtual environments

## Quick Security Check

Run this before committing:

```bash
# Check for sensitive patterns
git diff --staged | grep -i "api.key\|secret\|password\|token"

# Should return nothing, or only references to .env.example
```

## Summary

✅ **Your sensitive data is protected** - .gitignore is properly configured
✅ **Template files are provided** - `.env.example` files are safe to share
✅ **Best practices are documented** - Follow this guide
⚠️ **Stay vigilant** - Always check before committing
🔐 **Keep keys secret** - Never share or expose API keys

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing!
