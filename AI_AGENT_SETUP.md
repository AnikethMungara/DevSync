# AI Agent Service Architecture

## Overview

The DevSync IDE includes an AI agent that can interact with your codebase through secure tools. Due to async event loop conflicts on Windows, the AI agent runs as a **standalone microservice** that communicates with the main IDE backend via HTTP.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│   IDE Backend    │◀────▶│  Agent Service  │
│  (Port 3000)    │      │   (Port 8787)    │      │   (Port 9001)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │                          │
                                  │ Proxy                    │
                                  │ Requests                 │
                                  ▼                          ▼
                            /api/agent/*            OpenAI/Anthropic APIs
                                                    + Tool Execution
```

### Components

1. **Frontend** (`frontend/`)
   - Agent sidebar UI component
   - WebSocket streaming for real-time responses
   - Already fully implemented

2. **IDE Backend** (`backend/`)
   - Main FastAPI application (port 8787)
   - Contains proxy router at `/api/agent/*`
   - Forwards agent requests to port 9001

3. **Agent Service** (`agent-service/`)
   - Standalone FastAPI service (port 9001)
   - Provider-agnostic AI integration (OpenAI, Anthropic, Google)
   - Secure tool execution (filesystem, command execution, HTTP)
   - Session management with conversation history

## Files Created

### Agent Service
- `agent-service/main.py` - Standalone service entry point
- `agent-service/requirements.txt` - Python dependencies

### Proxy Router
- `backend/app/routers/agent_proxy.py` - HTTP proxy to forward requests

### Startup Scripts
- `START.bat` - Updated to launch all three services
- `START_ALL.bat` - Alternative unified startup script

## Current Status

⚠️ **AI Agent is TEMPORARILY DISABLED** due to Python module cache conflicts.

The agent router is commented out in:
- `backend/main.py` (lines 17 and 82)

## How to Enable After Reboot

After restarting your computer to clear Python's module cache:

### Step 1: Verify Dependencies

```bash
cd agent-service
pip install -r requirements.txt
```

### Step 2: Enable the Agent Proxy

Edit `backend/main.py`:

**Line 17** - Uncomment the import:
```python
# FROM:
# from app.routers import files, execution, problems, projects, agent_proxy
from app.routers import files, execution, problems, projects

# TO:
from app.routers import files, execution, problems, projects, agent_proxy
```

**Line 82** - Uncomment the router registration:
```python
# FROM:
# app.include_router(agent_proxy.router, prefix="/api/agent", tags=["agent"])

# TO:
app.include_router(agent_proxy.router, prefix="/api/agent", tags=["agent"])
```

### Step 3: Start All Services

Run the startup script:
```bash
START.bat
```

This will open 3 windows:
1. **DevSync Backend** - Main IDE backend (port 8787)
2. **DevSync AI Agent** - Agent service (port 9001)
3. **DevSync Frontend** - UI (port 3000)

### Step 4: Verify Services

Open your browser and check:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:8787/health
- Agent Health: http://localhost:9001/health

### Step 5: Test the Agent

1. Open the IDE at http://localhost:3000
2. Open the AI Assistant panel (agent sidebar)
3. Try a simple command like: "List all files in the workspace"

The agent should respond with the file tree!

## Configuration

Your API keys are already configured in `backend/.env`:

```env
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-cntAX...  # Your key is set
```

### Available Tools

The agent has access to these tools:
- `list_files` - Browse workspace directories
- `read_file` - Read file contents
- `write_file` - Create/update files
- `delete_file` - Remove files
- `run_command` - Execute shell commands (Python, npm, etc.)
- `http_fetch` - Make HTTP requests
- `search_web` - Web search (stub - needs implementation)

### Security Features

- **Path Jailing**: Agent can only access files in workspace directory
- **Command Sandboxing**: Commands run with timeout enforcement
- **Output Limits**: Truncates large outputs to prevent memory issues
- **Tool Allowlist**: Control which tools the agent can use

## Troubleshooting

### Agent Service Won't Start

**Problem**: `ModuleNotFoundError: No module named 'openai'`

**Solution**:
```bash
cd agent-service
pip install openai anthropic google-generativeai aiohttp
```

### Backend Hangs on Startup

**Problem**: Backend says "Application startup complete" but hangs on requests

**Solution**: This is the module cache issue. Requires a full system reboot.

### Agent Requests Return 503

**Problem**: IDE shows "AI Agent service is not available"

**Solution**: Make sure the agent service is running on port 9001:
```bash
curl http://localhost:9001/health
```

Should return:
```json
{"status":"ok","service":"ai-agent","version":"1.0.0"}
```

### File Explorer Not Working

**Problem**: File tree doesn't load or file operations fail

**Solution**: The file explorer is independent of the agent. If it's not working:
1. Check backend is running: `curl http://localhost:8787/health`
2. Check for trailing slashes in API calls (already fixed in frontend)
3. Restart backend without agent enabled

## Why Separate Service?

The AI agent is isolated in a separate process because:

1. **Event Loop Isolation**: Windows Proactor Event Loop (needed for subprocess execution) conflicts with async HTTP clients (OpenAI, Anthropic)

2. **Blame Isolation**: If the agent crashes, it doesn't take down the IDE

3. **Independent Scaling**: Agent service can be scaled separately or run on different hardware

4. **Clean Dependencies**: Agent dependencies don't pollute main backend

5. **Easier Debugging**: Agent issues don't affect file operations, code execution, etc.

## API Endpoints

### Agent Service (Port 9001)

- `POST /sessions` - Create new conversation session
- `POST /sessions/{id}/message` - Send message (non-streaming)
- `WS /sessions/{id}/stream` - Send message (streaming via WebSocket)
- `DELETE /sessions/{id}` - Delete session
- `POST /sessions/{id}/cancel` - Cancel current operation

### IDE Backend Proxy (Port 8787)

- All `/api/agent/*` requests are proxied to port 9001
- Frontend continues to call `/api/agent/*` as before

## Next Steps

After enabling the agent:

1. **Test Tool Calling**: Try commands that require multiple tools
   - "Read the package.json file and explain the dependencies"
   - "Create a new file called test.md with some content"

2. **Test Streaming**: WebSocket streaming shows responses as they're generated

3. **Test Error Handling**: Try invalid commands to verify error responses

4. **Add Custom Tools**: Extend `agent-service/main.py` with project-specific tools

5. **Frontend Enhancements**:
   - Add tool trace visualization
   - Add stop/cancel button
   - Add model selector dropdown
   - Show token usage stats

## Development

### Running Agent Service Standalone

```bash
cd agent-service
python main.py
```

### Running with Debug Mode

```bash
cd agent-service
uvicorn main:app --reload --log-level=debug
```

### Testing Agent API Directly

```bash
# Create session
curl -X POST http://localhost:9001/sessions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","temperature":0.7}'

# Send message
curl -X POST http://localhost:9001/sessions/{session_id}/message \
  -H "Content-Type: application/json" \
  -d '{"text":"List all files"}'
```

## Support

If you encounter issues after reboot:

1. Check all three services are running
2. Verify API keys in `.env`
3. Check browser console for errors
4. Check agent service logs in its terminal window
5. Test endpoints individually with curl

The architecture is sound - the current issue is just Windows module caching that requires a reboot to clear.
