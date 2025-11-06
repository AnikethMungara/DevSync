# Terminal Quick Reference Card

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Enter** | Execute command |
| **↑** | Previous command |
| **↓** | Next command |
| **Ctrl+C** | Cancel input |
| **Ctrl+L** | Clear screen |

## Built-in Commands

| Command | Description |
|---------|-------------|
| `cd <dir>` | Change directory |
| `cd ..` | Go up one level |
| `pwd` | Show current directory |
| `ls` / `dir` | List files |
| `clear` | Clear screen |
| `help` | Show help |
| `exit` / `quit` | Close terminal |

## Common Tasks

### Start Dev Server
```bash
npm run dev
```

### Install Packages
```bash
npm install
# or
pip install -r requirements.txt
```

### Git Commands
```bash
git status
git add .
git commit -m "message"
git push
```

### Navigate Project
```bash
cd frontend
ls
cd ../backend
pwd
```

### Check Processes
```bash
# Windows
netstat -an | findstr "8787"

# Linux/Mac
lsof -i :8787
```

## Tips

- **Multiple Terminals**: Click `+` to create new tab
- **Current Directory**: Shown in blue before `$`
- **Color Coding**: Green=commands, White=output, Red=errors
- **Command History**: Use ↑/↓ arrows
- **Clear Screen**: Type `clear` or press Ctrl+L

## Full Documentation

See [TERMINAL_GUIDE.md](TERMINAL_GUIDE.md) for complete guide.
