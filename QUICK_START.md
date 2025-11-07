# DevSync IDE - Quick Start ⚡

## Start Everything (1 Command)

```bash
START.bat
```

That's it! 🎉

## What You Get

- 🖥️ **Backend API** on http://localhost:8787
- 🤖 **AI Agent** on http://localhost:9001
- 🎨 **Frontend IDE** on http://localhost:3000

## Your OpenAI API Key

Already configured in `backend/.env`:
```
OPENAI_API_KEY=sk-proj-cntAXunKbh3mi9d3...
AI_MODEL=gpt-4o-mini
```

## Test AI Agent

1. Open http://localhost:3000
2. Click AI Assistant panel
3. Try: **"List all files in the workspace"**

The AI will execute tools and respond!

## Available AI Tools

- 📁 `list_files` - Browse directories
- 📖 `read_file` - Read file contents
- ✏️ `write_file` - Create/update files
- 🗑️ `delete_file` - Remove files
- ⚡ `run_command` - Execute Python, npm, etc.
- 🌐 `http_fetch` - Make HTTP requests

## Stop Everything

In the START.bat window, type:
```
end
```

Or close the three terminal windows.

## Troubleshooting

**Backend not responding?**
```bash
taskkill /F /IM python.exe
START.bat
```

**Agent not working?**
- Check http://localhost:9001/health
- Verify OpenAI API key in `backend/.env`

**Need fresh start?**
```bash
taskkill /F /IM python.exe /IM node.exe
START.bat
```

## Key Features

### 💻 Integrated Terminal
- Click **Terminal** tab in bottom panel
- Run commands directly in the IDE
- Multiple terminal sessions with tabs
- Command history (↑/↓ arrows)
- Shortcuts: Ctrl+L (clear), Ctrl+C (cancel)
- **See [TERMINAL_GUIDE.md](TERMINAL_GUIDE.md) for full guide**

### 🤖 AI Assistant
- Click AI icon in right sidebar
- Chat, explain code, refactor, write tests
- Real-time streaming responses
- Modes: Chat, Explain, Refactor, Test, Commit

### 📁 File Explorer
- Browse and edit files (left sidebar)
- Full CRUD operations
- Syntax highlighting
- Real-time problem detection

## Documentation

| Guide | Description |
|-------|-------------|
| [README.md](README.md) | Project overview and tech stack |
| [QUICK_START.md](QUICK_START.md) | **You are here** - Quick start guide |
| [TERMINAL_GUIDE.md](TERMINAL_GUIDE.md) | Integrated terminal features |
| [AI_AGENT_SETUP.md](AI_AGENT_SETUP.md) | AI agent configuration |
| [AI_AGENT_TROUBLESHOOTING.md](AI_AGENT_TROUBLESHOOTING.md) | AI troubleshooting |
| [COLLABORATION.md](COLLABORATION.md) | Real-time collaboration features |
| [NETWORK_ACCESS.md](NETWORK_ACCESS.md) | Access from other devices |
| [SECURITY.md](SECURITY.md) | Security best practices |
| [VIRTUAL_ENV_SETUP.md](VIRTUAL_ENV_SETUP.md) | Virtual environment details |

## What's Running

Three separate processes:
1. **Backend** (`backend/venv`) - Main IDE API on port 8787
2. **AI Agent** (`agent-service/venv`) - AI brain on port 9001
3. **Frontend** (Node) - React UI on port 3000

Each with isolated dependencies - no conflicts!

---

**Enjoy your AI-powered IDE! 🚀**
