# AI Agent Troubleshooting Guide

## Quick Check: Is Everything Running?

The AI Agent requires **3 services** to be running:

1. ✅ **Frontend** - Port 3000
2. ✅ **Backend** - Port 8787
3. ✅ **AI Agent Service** - Port 9001

### Verify Services Are Running

```bash
# Check if services are listening
netstat -an | findstr "3000"   # Frontend
netstat -an | findstr "8787"   # Backend
netstat -an | findstr "9001"   # AI Agent Service
```

All three should show `LISTENING`.

## Common Issues & Solutions

### Issue 1: "Failed to connect to AI service"

**Symptoms:**
- AI sidebar shows error message
- Red error banner appears
- Messages don't get responses

**Causes:**
- AI agent service not running
- WebSocket connection failed
- Backend proxy not configured

**Solutions:**

1. **Check if AI Agent Service is running:**
   ```bash
   netstat -an | findstr "9001"
   ```
   Should show: `0.0.0.0:9001  LISTENING`

2. **Restart all services:**
   ```bash
   # Stop all (Ctrl+C in each window)
   # Then restart:
   START.bat
   ```

3. **Check AI Agent Service logs:**
   - Look for the window titled "DevSync AI Agent"
   - Check for any error messages
   - Common errors:
     - `Module not found` - Run `pip install` in agent-service/venv
     - `Port already in use` - Kill process on port 9001

4. **Verify backend proxy configuration:**
   ```bash
   # Backend should have agent_proxy router enabled
   # Check backend/main.py line 79
   ```

---

### Issue 2: "No active AI session"

**Symptoms:**
- Can't send messages
- "No active AI session. Please refresh" error

**Causes:**
- Session creation failed
- Backend/agent service not responding
- API key not configured

**Solutions:**

1. **Refresh the page** - Sessions are created on page load

2. **Check API key configuration:**
   ```bash
   # Edit backend/.env
   OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
   ```

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Common errors:
     - `Failed to create session` - Backend not accessible
     - `401 Unauthorized` - Invalid API key
     - `Network error` - Services not running

---

### Issue 3: API Key Issues

**Symptoms:**
- Session created but no responses
- "Invalid API key" errors in logs
- 401 Unauthorized errors

**Solutions:**

1. **Verify API key is set:**
   ```bash
   # Check backend/.env
   cat backend/.env | findstr OPENAI
   ```

2. **Test API key manually:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR-API-KEY"
   ```

3. **Rotate API key if exposed:**
   - Go to: https://platform.openai.com/api-keys
   - Delete old key
   - Create new key
   - Update `backend/.env`

4. **Check OpenAI account:**
   - Verify you have credits
   - Check usage limits
   - Ensure key has correct permissions

---

### Issue 4: WebSocket Connection Fails

**Symptoms:**
- "Connection error" in AI sidebar
- Messages send but no response
- WebSocket errors in console

**Causes:**
- Agent service not running
- Firewall blocking WebSocket
- CORS issues

**Solutions:**

1. **Check WebSocket URL:**
   ```javascript
   // Should connect to: ws://localhost:8787/api/agent/sessions/{id}/stream
   // Then proxy to: ws://localhost:9001/sessions/{id}/stream
   ```

2. **Test WebSocket manually:**
   ```javascript
   // In browser console:
   const ws = new WebSocket('ws://localhost:9001/test')
   ws.onopen = () => console.log('Connected')
   ws.onerror = (e) => console.error('Error:', e)
   ```

3. **Check firewall:**
   ```bash
   # Allow WebSocket ports
   netsh advfirewall firewall add rule name="AI Agent WS" dir=in action=allow protocol=TCP localport=9001
   ```

4. **Verify CORS settings:**
   - Backend `main.py` should allow WebSocket upgrades
   - Check `allow_origins=["*"]` in development

---

### Issue 5: Slow or No Responses

**Symptoms:**
- Long wait times
- "AI is thinking..." stays forever
- Timeout errors

**Causes:**
- OpenAI API slow/down
- Rate limiting
- Network issues
- Large context

**Solutions:**

1. **Check OpenAI status:**
   - Visit: https://status.openai.com/

2. **Reduce context size:**
   - Uncheck "Project" context source
   - Use smaller code selections
   - Switch to faster model (gpt-4o-mini)

3. **Check rate limits:**
   ```bash
   # In backend logs, look for:
   # "Rate limit exceeded"
   ```

4. **Increase timeout:**
   ```python
   # backend/app/config.py
   AGENT_MAX_RUN_SECONDS=120  # Increase from 60
   ```

---

### Issue 6: Tool Execution Fails

**Symptoms:**
- "Tool execution failed" messages
- Commands don't run
- File operations fail

**Causes:**
- Insufficient permissions
- Invalid workspace paths
- Tool not allowed

**Solutions:**

1. **Check allowed tools:**
   ```bash
   # backend/.env
   AGENT_ALLOW_TOOLS=fs,exec,http,search
   ```

2. **Verify workspace permissions:**
   ```bash
   # Ensure workspace directory is writable
   ls -la backend/workspace
   ```

3. **Check tool executor logs:**
   - Look in backend terminal
   - Search for tool execution errors
   - Common issues:
     - Permission denied
     - Command not found
     - Timeout

---

## Diagnostic Commands

### Full System Check

```bash
# 1. Check all services
echo "=== Service Status ==="
netstat -an | findstr "3000 8787 9001"

# 2. Check API key
echo "=== API Key Status ==="
if exist backend\.env (
  findstr "OPENAI_API_KEY" backend\.env | findstr /V "your-"
  if %ERRORLEVEL% EQU 0 (echo API Key: Configured) else (echo API Key: NOT CONFIGURED!)
) else (
  echo ERROR: backend\.env not found!
)

# 3. Test backend health
echo "=== Backend Health ==="
curl http://localhost:8787/health

# 4. Test agent service (if running)
echo "=== Agent Service Check ==="
curl http://localhost:9001/health 2>nul || echo Agent service not responding
```

### Check Logs

```bash
# Backend logs
# Look in the "DevSync Backend" window

# AI Agent Service logs
# Look in the "DevSync AI Agent" window

# Frontend logs
# Open browser DevTools (F12) -> Console tab
```

---

## Step-by-Step Restart Procedure

If AI isn't working, follow these steps:

1. **Stop all services:**
   - Press Ctrl+C in all terminal windows
   - Close all "DevSync" windows

2. **Verify nothing is running:**
   ```bash
   netstat -an | findstr "3000 8787 9001"
   ```
   Should return nothing

3. **Check configuration:**
   ```bash
   # Verify API key is set
   type backend\.env | findstr OPENAI_API_KEY
   ```

4. **Start fresh:**
   ```bash
   START.bat
   ```

5. **Wait for all services:**
   - Wait for "Application startup complete" (backend)
   - Wait for "Uvicorn running on..." (agent service)
   - Wait for "Ready" (frontend)

6. **Test AI sidebar:**
   - Open http://localhost:3000
   - Click AI Assistant icon (right sidebar)
   - Look for green "● Connected" indicator
   - Try sending a message

---

## Configuration Checklist

Before using AI features, ensure:

- [ ] `backend/.env` file exists
- [ ] `OPENAI_API_KEY` is set (not placeholder)
- [ ] All three services start without errors
- [ ] No port conflicts (3000, 8787, 9001 available)
- [ ] Virtual environments activated
- [ ] All dependencies installed
- [ ] Firewall allows connections
- [ ] OpenAI account has credits

---

## Still Not Working?

### Enable Debug Mode

1. **Backend debug logging:**
   ```python
   # backend/.env
   LOG_LEVEL=DEBUG
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Console tab
   - Look for errors

3. **Check network tab:**
   - DevTools -> Network tab
   - Filter: WS (WebSockets)
   - Look for connection attempts

### Get Help

If you're still stuck:

1. **Collect information:**
   - OS and Python version
   - Error messages from all three services
   - Browser console errors
   - Screenshots if applicable

2. **Check documentation:**
   - [AI_AGENT_SETUP.md](AI_AGENT_SETUP.md)
   - [QUICK_START.md](QUICK_START.md)
   - [VIRTUAL_ENV_SETUP.md](VIRTUAL_ENV_SETUP.md)

3. **Common fixes that work:**
   - Restart computer (clears port locks)
   - Delete and recreate virtual environments
   - Rotate OpenAI API key
   - Clear browser cache
   - Use Chrome/Edge (better WebSocket support)

---

## Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Can't send messages | Refresh page |
| No response | Check agent service (port 9001) |
| Connection error | Restart START.bat |
| API key error | Check backend/.env |
| Slow responses | Use gpt-4o-mini model |
| Tool failures | Check AGENT_ALLOW_TOOLS |

---

**TIP**: Keep the START.bat windows visible so you can see errors in real-time!
