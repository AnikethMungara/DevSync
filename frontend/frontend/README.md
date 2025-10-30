# Collaborative Code Editor

A real-time collaborative code editing web application built with Vite, React, Monaco Editor, and Yjs.

## Features

- **Monaco Editor**: Multi-tab editing with format on save and diagnostics
- **Real-time Collaboration**: Yjs-powered co-editing with presence cursors
- **Terminal**: Windows-compatible terminal panel (xterm.js with PTY over WebSocket)
- **File Tree**: Full CRUD operations on project files
- **Extensions**: Lightweight extension system with right-pane view contributions
- **Dark Theme**: Default dark mode with theme persistence

## Tech Stack

- **Bundler**: Vite
- **Framework**: React 18
- **Editor**: Monaco Editor
- **Collaboration**: Yjs, y-monaco, y-websocket
- **Terminal**: xterm.js with fit addon
- **State Management**: Zustand (UI state) + React Query (server state)
- **Routing**: React Router DOM
- **Validation**: Zod

## Environment Variables

Create a `.env` file in the frontend directory:

\`\`\`env
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787/ws
VITE_TERMINAL_ENABLED=true
VITE_EXTENSIONS_ENABLED=true
\`\`\`

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

\`\`\`bash
npm run build
\`\`\`

## Backend API Contract

The application expects the following REST endpoints:

- `GET /api/projects/:id/tree` - Get project file tree
- `GET /api/files?path=...` - Get file content
- `PUT /api/files` - Update file
- `POST /api/files` - Create file
- `DELETE /api/files?path=...` - Delete file
- `GET /api/search?projectId=...&q=...` - Search in project

WebSocket endpoint at `VITE_WS_URL` with channels:

- `presence` - User presence (join, leave, ping, pong, roster)
- `collab:<fileId>` - Yjs updates for collaborative editing
- `terminal:<sessionId>` - Terminal I/O

## Keyboard Shortcuts

- `Ctrl/Cmd+S` - Save current file
- `Ctrl/Cmd+K` - Open command palette

## Project Structure

\`\`\`
frontend/
├── src/
│   ├── assets/
│   │   └── placeholder.txt
│   ├── components/
│   │   └── Editor.jsx
│   ├── utils/
│   │   └── helpers.js
│   ├── index.css
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js
├── package.json
└── README.md
