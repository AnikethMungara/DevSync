# Process Management Guide

## The Zombie Process Problem

### What causes zombie processes?

1. **Background processes with `start /B`** - Creates detached processes that survive terminal closure
2. **Uvicorn `--reload` flag** - Creates parent watcher + child server processes
3. **Windows SO_REUSEADDR** - Multiple processes can bind to the same port
4. **Unclosed CMD windows** - Keep processes alive indefinitely

### How the NEW START.bat fixes this:

**Before:** Used `start /B` (background) → Created invisible zombie processes
**After:** Uses `start "title" cmd /c` → Creates VISIBLE windows you can close

## How to Use START.bat Correctly

### Starting the servers:
```cmd
cd DevSync
START.bat
```

This will:
1. Kill ALL existing Python and Node processes
2. Open 2 new CMD windows:
   - "DevSync Backend [DO NOT CLOSE]" - Python backend
   - "DevSync Frontend [DO NOT CLOSE]" - Node frontend
3. Show you a prompt where you can type "end" to stop everything

### Stopping the servers:

**Method 1: Type "end"**
- In the original START.bat window, type `end` and press Enter
- This kills ALL Python and Node processes

**Method 2: Close the windows**
- Close the "DevSync Backend" window → Kills backend
- Close the "DevSync Frontend" window → Kills frontend

**Method 3: Task Manager**
- Press `Ctrl+Shift+Esc`
- Go to "Details" tab
- Find `python.exe` and `node.exe`
- Right-click → "End Process Tree"

## Preventing Zombie Processes

### ✅ DO:
- Use the START.bat script to start servers
- Close the visible CMD windows to stop servers
- Type "end" in the START.bat window to stop everything
- Use Task Manager to verify processes are stopped

### ❌ DON'T:
- Don't run `python -m uvicorn` or `npm run dev` directly in background
- Don't use `&` or `start /B` to background processes
- Don't leave CMD windows minimized and forgotten
- Don't manually kill processes without closing parent windows first

## Checking for Zombie Processes

### Check if backend is running:
```cmd
netstat -ano | findstr :8787
```

Should show ONLY ONE process listening on port 8787.

### Check if frontend is running:
```cmd
netstat -ano | findstr :3000
```

### If you see multiple processes:
This means you have zombies. Clean them up:

```cmd
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

Then restart with START.bat

## Port Already in Use Error

If you get "port already in use":

1. Run: `netstat -ano | findstr :8787`
2. Note all the PIDs in the "LISTENING" state
3. Kill them: `taskkill /F /PID <pid>`
4. Restart START.bat

## Best Practices

1. **Always use START.bat** - Don't start servers manually
2. **Keep CMD windows visible** - Don't minimize them
3. **Stop properly** - Type "end" or close windows, don't just kill terminals
4. **Check ports before starting** - Verify no old processes exist
5. **Restart computer** - If zombies persist, a restart cleans everything

## Why This Matters

Multiple backend processes on the same port means:
- Requests randomly hit different processes
- Some have old code, some have new code
- Code changes don't appear to work
- Debugging becomes impossible

The visible window approach ensures:
- ✅ You can see when processes are running
- ✅ Closing the window properly terminates the process
- ✅ No hidden background processes
- ✅ Clean start every time
