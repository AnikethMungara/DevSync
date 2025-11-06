# Integrated Terminal Guide

The DevSync IDE includes a fully functional integrated terminal that allows you to run commands directly within the IDE.

## Features

### Multiple Terminal Tabs
- Create multiple terminal sessions with the `+` button
- Switch between terminals by clicking on the tabs
- Close terminals with the `X` button on each tab

### Command History
- **↑ Arrow**: Navigate backward through command history
- **↓ Arrow**: Navigate forward through command history
- Commands are saved across the session

### Keyboard Shortcuts
- **Enter**: Execute the current command
- **Ctrl+C**: Cancel/clear the current input
- **Ctrl+L**: Clear the terminal screen
- **↑/↓**: Navigate command history

### Current Working Directory
The current directory is displayed in blue before the `$` prompt, showing you exactly where commands will execute.

## Built-in Commands

The terminal includes several built-in commands for common operations:

### Directory Navigation
```bash
cd <directory>    # Change to specified directory
cd ..             # Go up one directory
pwd               # Print current working directory
```

### File Operations
```bash
ls                # List directory contents (cross-platform)
dir               # List directory contents (Windows style)
```

### Terminal Control
```bash
clear             # Clear the terminal screen
help              # Show available commands
exit              # Close the current terminal session
quit              # Same as exit
```

## Running System Commands

You can run any system command available on your machine:

### Development Commands
```bash
# Node.js
npm install
npm run dev
node script.js

# Python
python script.py
pip install package

# Git
git status
git add .
git commit -m "message"

# Other tools
curl https://api.example.com
grep "search" file.txt
```

### Working with Projects

The terminal's current directory is isolated to the workspace, providing security:

```bash
# Navigate to project folders
cd frontend
cd backend

# Install dependencies
npm install

# Run scripts
npm run build
python -m venv venv

# Check status
git status
ls -la
```

## Color Coding

The terminal uses color coding for better readability:

- **Green**: Commands you type
- **White**: Standard output (stdout)
- **Red**: Error output (stderr)
- **Blue**: Current directory path

## Tips & Tricks

### 1. Long-Running Commands
The terminal supports long-running commands like development servers:
```bash
npm run dev
python -m uvicorn main:app --reload
```

### 2. Command Chaining
Chain multiple commands with `&&`:
```bash
cd backend && npm install && npm start
```

### 3. Multiple Terminals
Use multiple terminal tabs for different tasks:
- Tab 1: Frontend development server
- Tab 2: Backend development server
- Tab 3: Running tests
- Tab 4: Git operations

### 4. Quick Directory Switching
Save time by opening a terminal in the directory you need:
```bash
cd frontend/components
ls
# Work with files in this directory
```

### 5. Environment Variables
Environment variables from your system are available in the terminal:
```bash
# Windows
echo %PATH%

# Linux/Mac
echo $PATH
```

## Workspace Security

The terminal operates within a workspace sandbox for security:

- Commands execute in the workspace directory by default
- You cannot navigate outside the workspace root
- This prevents accidental system-wide changes

## Troubleshooting

### Terminal Not Responding
1. Check if the backend service is running (port 8787)
2. Look for WebSocket connection errors in browser console (F12)
3. Try creating a new terminal tab

### Commands Not Found
- Ensure the command is installed on your system
- Check your system PATH environment variable
- Try using the full path to the executable

### Permission Errors
- Some commands may require administrator/sudo privileges
- Check file/folder permissions
- Ensure workspace directory is writable

### Output Not Showing
- Wait a few seconds for command to complete
- Check if command requires user input (not supported in WebSocket mode)
- Look for error messages in red

## Common Workflows

### Starting Development Servers

Create separate terminals for each service:

**Terminal 1 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend**:
```bash
cd backend
venv/Scripts/python -m uvicorn main:app --reload
```

**Terminal 3 - AI Agent**:
```bash
cd agent-service
venv/Scripts/python -m uvicorn main:app --port 9001
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
pytest
```

### Git Workflow

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Add feature"

# Push
git push origin main
```

### Debugging

```bash
# Check logs
tail -f logs/app.log

# Test API endpoints
curl http://localhost:8787/health

# Check running processes
netstat -an | findstr "8787"  # Windows
lsof -i :8787                  # Linux/Mac
```

## Advanced Features

### Command Timeout
Commands automatically timeout after 30 seconds to prevent hanging. For longer operations, consider running them outside the terminal.

### Session Persistence
Terminal sessions persist until you:
- Close the terminal tab
- Refresh the page
- Close the browser

### WebSocket Connection
The terminal uses WebSocket for real-time communication:
- Instant command execution
- Live output streaming
- No page refresh needed

## Limitations

Current limitations of the integrated terminal:

1. **Interactive Commands**: Commands requiring user input during execution are not fully supported
2. **Text Editors**: Terminal-based editors (vim, nano) won't work properly
3. **GUI Applications**: Cannot launch GUI applications
4. **Ctrl+C for Processes**: Cannot interrupt running processes (timeout applies)

For these cases, use your system terminal instead.

## Future Enhancements

Planned features for future releases:

- Tab completion for commands and file paths
- Split terminal view
- Terminal themes and customization
- Copy/paste support
- Search in terminal output
- Export terminal output to file
- Different shell support (bash, zsh, powershell)

---

**Need Help?**

- Type `help` in the terminal for quick reference
- Check [QUICK_START.md](QUICK_START.md) for general IDE setup
- Report issues or request features in the project repository
