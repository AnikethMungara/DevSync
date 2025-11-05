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

## Documentation

- `AI_AGENT_SETUP.md` - AI agent architecture
- `VIRTUAL_ENV_SETUP.md` - Virtual environment details
- `README.md` - Full project documentation

## What's Running

Three separate processes:
1. **Backend** (`backend/venv`) - Main IDE API
2. **AI Agent** (`agent-service/venv`) - AI brain
3. **Frontend** (Node) - React UI

Each with isolated dependencies - no conflicts!

---

**Enjoy your AI-powered IDE! 🚀**
