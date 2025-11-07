# DevSync IDE

> A modern, AI-powered collaborative development environment with real-time editing, integrated terminal, code execution, and file management.

## ⚡ Quick Start

```bash
START.bat
```

That's it! Open http://localhost:3000 in your browser.

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

## ✨ Features

### 🎨 Modern IDE Experience
- **Monaco Editor** - VS Code-style editor with syntax highlighting
- **File Explorer** - Full CRUD operations for project files
- **Problem Panel** - Real-time error detection and diagnostics
- **Multi-tab Interface** - Work on multiple files simultaneously

### 💻 Integrated Terminal
- Multiple terminal sessions with tabs
- Command history navigation (↑/↓ arrows)
- Keyboard shortcuts (Ctrl+C, Ctrl+L)
- Built-in commands (cd, ls, pwd, help)
- Full system command support (npm, python, git, etc.)

### 🤖 AI Assistant
- Chat with AI to explain code, refactor, write tests
- Real-time streaming responses
- Multiple modes: Chat, Explain, Refactor, Test, Commit
- Tool execution: File operations, HTTP requests, code execution

### 👥 Real-Time Collaboration
- Live presence - see who's online
- Cursor sharing - view other users' positions
- Built-in chat system
- Document synchronization

### 🚀 Code Execution
- Run Python, JavaScript, and shell commands
- Real-time output streaming
- Environment variable support
- Workspace sandboxing for security

### ⏱️ Checkpoints (Version Control)
- Create snapshots of your entire project
- Revert to any checkpoint with one click
- Automatic cleanup (keeps last 3 checkpoints)
- Smart exclusions (skips node_modules, venv, etc.)

### ⚙️ Settings & Customization
- Theme switcher (dark, light, high-contrast)
- Font size and family customization
- Editor preferences (tab size, word wrap, minimap)
- Keyboard shortcuts reference
- Persistent settings across sessions

## 🛠️ Tech Stack

### Backend
- **Python 3.10+** with FastAPI
- **Uvicorn** - ASGI server
- **WebSocket** - Real-time communication
- **aiosqlite** - Async database
- **Pydantic V2** - Data validation

### Frontend
- **Next.js 16** - React framework with Turbopack
- **React 19** - UI library
- **TypeScript** - Type safety
- **Zustand** - State management
- **Monaco Editor** - Code editor
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons

### AI Agent
- **OpenAI API** - GPT-4o-mini
- **Tool Calling** - File system, execution, HTTP
- **Streaming** - Real-time responses

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | ⚡ Get started in 1 minute |
| [TERMINAL_GUIDE.md](TERMINAL_GUIDE.md) | Terminal features and keyboard shortcuts |
| [CHECKPOINTS_GUIDE.md](CHECKPOINTS_GUIDE.md) | Project snapshots and version control |
| [SETTINGS_GUIDE.md](SETTINGS_GUIDE.md) | Customize IDE appearance and behavior |
| [AI_AGENT_SETUP.md](AI_AGENT_SETUP.md) | Configure AI assistant with OpenAI |
| [AI_AGENT_TROUBLESHOOTING.md](AI_AGENT_TROUBLESHOOTING.md) | Fix AI-related issues |
| [COLLABORATION.md](COLLABORATION.md) | Real-time multi-user collaboration |
| [NETWORK_ACCESS.md](NETWORK_ACCESS.md) | Access from phones/tablets |
| [SECURITY.md](SECURITY.md) | API key safety and best practices |
| [VIRTUAL_ENV_SETUP.md](VIRTUAL_ENV_SETUP.md) | Python virtual environment details |

## 🏗️ Architecture

DevSync uses a **microservice architecture** with 3 isolated services:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend API   │      │  AI Agent       │
│   (Next.js)     │◄────►│   (FastAPI)     │◄────►│  (FastAPI)      │
│   Port 3000     │      │   Port 8787     │      │  Port 9001      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                        │
         │                        │                        │
    Browser UI            File System              OpenAI API
```

**Benefits:**
- ✅ Isolated dependencies (no conflicts)
- ✅ Independent scaling
- ✅ Fault isolation
- ✅ Easy maintenance

## 🚦 Getting Started

### Prerequisites
- **Node.js 18+** (frontend)
- **Python 3.10+** (backend + AI agent)
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DevSync
   ```

2. **Set up API key** (optional, for AI features)

   Create `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   AI_MODEL=gpt-4o-mini
   ```

3. **Start everything**
   ```bash
   START.bat
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Stopping

Type `end` in the START.bat window or close the terminal windows.

## 📖 Usage Examples

### Using the Terminal
```bash
# Navigate to backend
cd backend

# Install Python packages
pip install -r requirements.txt

# Run tests
pytest

# Check Git status
git status
```

### Using AI Assistant
- Click the AI icon in the right sidebar
- Try: "List all Python files in the backend"
- Try: "Explain what the terminal router does"
- Try: "Refactor the executeCommand function"

### Collaboration
1. Click Users icon in left sidebar
2. Create new session
3. Share Session ID with teammates
4. Code together in real-time!

## 🔧 Development

### Project Structure
```
DevSync/
├── frontend/           # Next.js frontend
│   ├── app/           # App router pages
│   ├── components/    # React components
│   └── lib/           # Utilities and state
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── routers/   # API endpoints
│   │   ├── models/    # Data models
│   │   └── utils/     # Utilities
│   └── venv/          # Python virtual env
└── agent-service/     # AI agent service
    ├── app/
    │   ├── tools/     # AI tools
    │   └── core/      # Agent logic
    └── venv/          # Python virtual env
```

### Running Services Individually

**Backend only:**
```bash
cd backend
venv\Scripts\python -m uvicorn main:app --reload
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

**AI Agent only:**
```bash
cd agent-service
venv\Scripts\python -m uvicorn main:app --port 9001
```

## 🔒 Security

- ⚠️ **Never commit `.env` files** - API keys are sensitive
- ✅ `.env` files are in `.gitignore`
- ✅ Use `.env.example` templates for setup
- ⚠️ Rotate API keys if exposed to Git
- ✅ Workspace sandboxing prevents file system escape

See [SECURITY.md](SECURITY.md) for detailed security practices.

## 🐛 Troubleshooting

**Backend not responding?**
```bash
taskkill /F /IM python.exe
START.bat
```

**Frontend won't start?**
```bash
cd frontend
npm install
npm run dev
```

**AI agent not working?**
- Check http://localhost:9001/health
- Verify `OPENAI_API_KEY` in `backend/.env`
- See [AI_AGENT_TROUBLESHOOTING.md](AI_AGENT_TROUBLESHOOTING.md)

**Need fresh start?**
```bash
taskkill /F /IM python.exe /IM node.exe
START.bat
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with FastAPI, Next.js, and Monaco Editor
- AI powered by OpenAI GPT-4o-mini
- Icons by Lucide React

---

**Made with ❤️ by the DevSync team**
