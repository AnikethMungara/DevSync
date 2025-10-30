"use client"

import { Routes, Route, useParams, useNavigate } from "react-router-dom"
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { z } from "zod"
import Editor from "./components/Editor"
import AIAgentSidebar from "./components/AIAgentSidebar"
import { cn, debounce } from "./utils/helpers"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787"
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8787/ws"
const TERMINAL_ENABLED = import.meta.env.VITE_TERMINAL_ENABLED === "true"
const EXTENSIONS_ENABLED = import.meta.env.VITE_EXTENSIONS_ENABLED === "true"

// Zod schemas for validation
const FileTreeSchema = z.object({
  entries: z.array(
    z.object({
      path: z.string(),
      type: z.enum(["file", "dir"]),
    }),
  ),
})

const FileContentSchema = z.object({
  path: z.string(),
  content: z.string(),
})

const SearchResultSchema = z.object({
  matches: z.array(
    z.object({
      path: z.string(),
      line: z.number(),
      preview: z.string(),
    }),
  ),
})

// Zustand stores
const useUIStore = create(
  persist(
    (set) => ({
      theme: "dark",
      showSidebar: true,
      showTerminal: false,
      showRightPane: true,
      activeRightTab: "extensions",
      isAISidebarOpen: false,
      sidebarWidth: 250,
      terminalHeight: 200,
      rightPaneWidth: 300,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
      toggleRightPane: () => set((state) => ({ showRightPane: !state.showRightPane })),
      toggleAISidebar: () => set((state) => ({ isAISidebarOpen: !state.isAISidebarOpen })),
      setActiveRightTab: (tab) => set({ activeRightTab: tab }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setTerminalHeight: (height) => set({ terminalHeight: height }),
      setRightPaneWidth: (width) => set({ rightPaneWidth: width }),
    }),
    { name: "ui-store" },
  ),
)

const useEditorStore = create(
  persist(
    (set, get) => ({
      openTabs: [],
      activeTabId: null,
      buffers: {},
      addTab: (path) =>
        set((state) => {
          if (state.openTabs.includes(path)) {
            return { activeTabId: path }
          }
          return {
            openTabs: [...state.openTabs, path],
            activeTabId: path,
            buffers: {
              ...state.buffers,
              [path]: { content: "", dirty: false, ydoc: null },
            },
          }
        }),
      closeTab: (path) =>
        set((state) => {
          const newTabs = state.openTabs.filter((t) => t !== path)
          const newBuffers = { ...state.buffers }
          delete newBuffers[path]
          const newActiveTab = state.activeTabId === path ? newTabs[newTabs.length - 1] || null : state.activeTabId
          return {
            openTabs: newTabs,
            activeTabId: newActiveTab,
            buffers: newBuffers,
          }
        }),
      setActiveTab: (path) => set({ activeTabId: path }),
      updateBuffer: (path, updates) =>
        set((state) => ({
          buffers: {
            ...state.buffers,
            [path]: { ...state.buffers[path], ...updates },
          },
        })),
      markDirty: (path, dirty) =>
        set((state) => ({
          buffers: {
            ...state.buffers,
            [path]: { ...state.buffers[path], dirty },
          },
        })),
    }),
    {
      name: "editor-store",
      partialize: (state) => ({
        openTabs: state.openTabs,
        activeTabId: state.activeTabId,
      }),
    },
  ),
)

// WebSocket Context
const WebSocketContext = createContext(null)

function WebSocketProvider({ children }) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const handlersRef = useRef(new Map())
  const [status, setStatus] = useState("connecting")
  const [latency, setLatency] = useState(null)
  const pingIntervalRef = useRef(null)
  const lastPingRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[WS] Connected")
        setStatus("connected")
        reconnectAttemptsRef.current = 0

        // Start ping/pong for latency
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            lastPingRef.current = Date.now()
            send("presence", { type: "ping" })
          }
        }, 5000)

        // Join presence
        send("presence", { type: "join", userId: "user-" + Math.random().toString(36).substr(2, 9) })
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const { channel, type } = message

          if (channel === "presence" && type === "pong") {
            const now = Date.now()
            if (lastPingRef.current) {
              setLatency(now - lastPingRef.current)
            }
          }

          const handlers = handlersRef.current.get(channel) || []
          handlers.forEach((handler) => handler(message))
        } catch (err) {
          console.error("[WS] Parse error:", err)
        }
      }

      ws.onerror = (error) => {
        console.error("[WS] Error:", error)
        setStatus("error")
      }

      ws.onclose = () => {
        console.log("[WS] Disconnected")
        setStatus("disconnected")
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }

        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    } catch (err) {
      console.error("[WS] Connection error:", err)
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const send = useCallback((channel, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ channel, ...payload }))
    }
  }, [])

  const subscribe = useCallback((channel, handler) => {
    if (!handlersRef.current.has(channel)) {
      handlersRef.current.set(channel, [])
    }
    handlersRef.current.get(channel).push(handler)

    return () => {
      const handlers = handlersRef.current.get(channel) || []
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    }
  }, [])

  return <WebSocketContext.Provider value={{ send, subscribe, status, latency }}>{children}</WebSocketContext.Provider>
}

function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) throw new Error("useWebSocket must be used within WebSocketProvider")
  return context
}

// Toast system
const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Date.now()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
}))

function Toast() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn("toast", `toast--${toast.type}`)}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}

// File Tree Component
function FileTree({ projectId }) {
  const queryClient = useQueryClient()
  const addToast = useToastStore((state) => state.addToast)
  const addTab = useEditorStore((state) => state.addTab)
  const [contextMenu, setContextMenu] = useState(null)
  const [expandedDirs, setExpandedDirs] = useState(new Set(["/"]))

  const { data: tree, isLoading } = useQuery({
    queryKey: ["tree", projectId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/tree`)
      if (!res.ok) throw new Error("Failed to load tree")
      const data = await res.json()
      return FileTreeSchema.parse(data)
    },
  })

  const createFileMutation = useMutation({
    mutationFn: async ({ path, content }) => {
      const res = await fetch(`${API_URL}/api/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      })
      if (!res.ok) throw new Error("Failed to create file")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tree", projectId])
      addToast("File created", "success")
    },
    onError: () => addToast("Failed to create file", "error"),
  })

  const deleteFileMutation = useMutation({
    mutationFn: async (path) => {
      const res = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete file")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tree", projectId])
      addToast("File deleted", "success")
    },
    onError: () => addToast("Failed to delete file", "error"),
  })

  const handleContextMenu = (e, entry) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }

  const handleNewFile = () => {
    const fileName = prompt("Enter file name:")
    if (fileName) {
      const basePath = contextMenu.entry.type === "dir" ? contextMenu.entry.path : "/"
      const fullPath = basePath === "/" ? `/${fileName}` : `${basePath}/${fileName}`
      createFileMutation.mutate({ path: fullPath, content: "" })
    }
    setContextMenu(null)
  }

  const handleDelete = () => {
    if (confirm(`Delete ${contextMenu.entry.path}?`)) {
      deleteFileMutation.mutate(contextMenu.entry.path)
    }
    setContextMenu(null)
  }

  const handleRename = () => {
    addToast("Rename: TODO", "info")
    setContextMenu(null)
  }

  const handleNewFolder = () => {
    addToast("New Folder: TODO", "info")
    setContextMenu(null)
  }

  const toggleDir = (path) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  if (isLoading) return <div className="file-tree__loading">Loading...</div>

  const entries = tree?.entries || []
  const dirs = entries.filter((e) => e.type === "dir")
  const files = entries.filter((e) => e.type === "file")

  return (
    <div className="file-tree">
      <div className="file-tree__header">Files</div>
      <div className="file-tree__content">
        {dirs.map((dir) => (
          <div key={dir.path}>
            <div
              className="file-tree__item file-tree__item--dir"
              onClick={() => toggleDir(dir.path)}
              onContextMenu={(e) => handleContextMenu(e, dir)}
            >
              <span className="file-tree__icon">{expandedDirs.has(dir.path) ? "📂" : "📁"}</span>
              {dir.path.split("/").pop() || dir.path}
            </div>
          </div>
        ))}
        {files.map((file) => (
          <div
            key={file.path}
            className="file-tree__item file-tree__item--file"
            onClick={() => addTab(file.path)}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            <span className="file-tree__icon">📄</span>
            {file.path.split("/").pop()}
          </div>
        ))}
      </div>
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="context-menu__item" onClick={handleNewFile}>
            New File
          </div>
          <div className="context-menu__item" onClick={handleNewFolder}>
            New Folder
          </div>
          <div className="context-menu__item" onClick={handleRename}>
            Rename
          </div>
          <div className="context-menu__item" onClick={handleDelete}>
            Delete
          </div>
        </div>
      )}
    </div>
  )
}

// Search Panel
function SearchPanel({ projectId }) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results } = useQuery({
    queryKey: ["search", projectId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { matches: [] }
      const res = await fetch(`${API_URL}/api/search?projectId=${projectId}&q=${encodeURIComponent(debouncedQuery)}`)
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      return SearchResultSchema.parse(data)
    },
    enabled: !!debouncedQuery,
  })

  return (
    <div className="search-panel">
      <div className="search-panel__header">Search</div>
      <input
        type="text"
        className="search-panel__input"
        placeholder="Search in files..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="search-panel__results">
        {results?.matches.map((match, i) => (
          <div key={i} className="search-panel__result">
            <div className="search-panel__result-path">
              {match.path}:{match.line}
            </div>
            <div className="search-panel__result-preview">{match.preview}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Terminal Component
function Terminal({ projectId }) {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const sessionIdRef = useRef("term-" + Math.random().toString(36).substr(2, 9))
  const { send, subscribe } = useWebSocket()
  const addToast = useToastStore((state) => state.addToast)

  useEffect(() => {
    let xterm, fitAddon

    const initTerminal = async () => {
      const { Terminal } = await import("@xterm/xterm")
      const { FitAddon } = await import("@xterm/addon-fit")

      xterm = new Terminal({
        cursorBlink: true,
        theme: {
          background: "#1e1e1e",
          foreground: "#d4d4d4",
        },
      })

      fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)
      xterm.open(terminalRef.current)
      fitAddon.fit()

      xtermRef.current = xterm
      fitAddonRef.current = fitAddon

      // Send data to backend
      xterm.onData((data) => {
        send(`terminal:${sessionIdRef.current}`, { type: "data", data })
      })

      // Open terminal session
      send(`terminal:${sessionIdRef.current}`, {
        type: "open",
        cols: xterm.cols,
        rows: xterm.rows,
      })

      // Subscribe to terminal output
      const unsubscribe = subscribe(`terminal:${sessionIdRef.current}`, (message) => {
        if (message.type === "data" && message.data) {
          xterm.write(message.data)
        } else if (message.type === "exit") {
          xterm.write("\r\n[Process exited]\r\n")
        }
      })

      return () => {
        unsubscribe()
        xterm.dispose()
      }
    }

    if (!TERMINAL_ENABLED) {
      addToast("Terminal requires Windows backend PTY", "info")
      return
    }

    initTerminal()

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose()
      }
    }
  }, [send, subscribe, addToast])

  useEffect(() => {
    const handleResize = debounce(() => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
        send(`terminal:${sessionIdRef.current}`, {
          type: "resize",
          cols: xtermRef.current.cols,
          rows: xtermRef.current.rows,
        })
      }
    }, 100)

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [send])

  if (!TERMINAL_ENABLED) {
    return (
      <div className="terminal terminal--disabled">
        <div className="terminal__banner">Terminal requires Windows backend PTY</div>
      </div>
    )
  }

  return (
    <div className="terminal">
      <div className="terminal__header">
        <span>Terminal</span>
        <button className="terminal__new-btn" onClick={() => addToast("New Terminal: TODO", "info")}>
          + New Terminal
        </button>
      </div>
      <div ref={terminalRef} className="terminal__content" />
    </div>
  )
}

// Extensions Panel
function ExtensionsPanel() {
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const buffers = useEditorStore((state) => state.buffers)
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    if (activeTabId && buffers[activeTabId]) {
      const content = buffers[activeTabId].content || ""
      const words = content.split(/\s+/).filter((w) => w.length > 0).length
      setWordCount(words)
    }
  }, [activeTabId, buffers])

  if (!EXTENSIONS_ENABLED) return null

  return (
    <div className="extensions-panel">
      <div className="extensions-panel__header">Extensions</div>
      <div className="extensions-panel__content">
        <div className="extension-view">
          <h3 className="extension-view__title">Word Count</h3>
          <div className="extension-view__body">
            <p>
              Current file: <strong>{activeTabId || "None"}</strong>
            </p>
            <p>
              Words: <strong>{wordCount}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Problems Panel
function ProblemsPanel({ projectId }) {
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const buffers = useEditorStore((state) => state.buffers)
  const [problems, setProblems] = useState([])

  useEffect(() => {
    if (activeTabId && buffers[activeTabId]) {
      const content = buffers[activeTabId].content || ""
      const lines = content.split("\n")
      const detected = []

      lines.forEach((line, i) => {
        if (line.endsWith(" ") || line.endsWith("\t")) {
          detected.push({
            path: activeTabId,
            line: i + 1,
            message: "Trailing whitespace",
            severity: "warning",
          })
        }
      })

      setProblems(detected)
    }
  }, [activeTabId, buffers])

  return (
    <div className="problems-panel">
      <div className="problems-panel__header">Problems ({problems.length})</div>
      <div className="problems-panel__content">
        {problems.map((problem, i) => (
          <div key={i} className="problems-panel__item">
            <span className={cn("problems-panel__severity", `problems-panel__severity--${problem.severity}`)}>
              {problem.severity === "error" ? "❌" : "⚠️"}
            </span>
            <span className="problems-panel__message">{problem.message}</span>
            <span className="problems-panel__location">
              {problem.path}:{problem.line}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Command Palette
function CommandPalette({ isOpen, onClose }) {
  const setTheme = useUIStore((state) => state.setTheme)
  const theme = useUIStore((state) => state.theme)
  const toggleTerminal = useUIStore((state) => state.toggleTerminal)
  const toggleAISidebar = useUIStore((state) => state.toggleAISidebar)
  const setActiveRightTab = useUIStore((state) => state.setActiveRightTab)
  const addToast = useToastStore((state) => state.addToast)

  const commands = [
    {
      label: "Toggle Theme",
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark")
        addToast(`Theme: ${theme === "dark" ? "light" : "dark"}`, "success")
        onClose()
      },
    },
    {
      label: "New Terminal",
      action: () => {
        toggleTerminal()
        onClose()
      },
    },
    {
      label: "Ask AI (Ctrl/Cmd+I)",
      action: () => {
        setActiveRightTab("ai")
        toggleAISidebar()
        onClose()
      },
    },
    {
      label: "Focus Problems",
      action: () => {
        addToast("Focus Problems: TODO", "info")
        onClose()
      },
    },
  ]

  if (!isOpen) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input type="text" className="command-palette__input" placeholder="Type a command..." autoFocus />
        <div className="command-palette__list">
          {commands.map((cmd, i) => (
            <div key={i} className="command-palette__item" onClick={cmd.action}>
              {cmd.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Status Bar
function StatusBar() {
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const buffers = useEditorStore((state) => state.buffers)
  const { status, latency } = useWebSocket()
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  const isDirty = activeTabId && buffers[activeTabId]?.dirty

  return (
    <div className="statusbar">
      <div className="statusbar__section">
        <span className="statusbar__item">{activeTabId || "No file"}</span>
        {isDirty && <span className="statusbar__item statusbar__item--dirty">●</span>}
      </div>
      <div className="statusbar__section">
        <span className="statusbar__item">
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        <span className={cn("statusbar__item", `statusbar__item--${status}`)}>
          {status === "connected" ? "🟢" : status === "connecting" ? "🟡" : "🔴"} {status}
          {latency && ` (${latency}ms)`}
        </span>
      </div>
    </div>
  )
}

// Right Pane
function RightPane({ projectId }) {
  const activeRightTab = useUIStore((state) => state.activeRightTab)
  const setActiveRightTab = useUIStore((state) => state.setActiveRightTab)
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const buffers = useEditorStore((state) => state.buffers)

  const fileContent = activeTabId && buffers[activeTabId] ? buffers[activeTabId].content : null

  return (
    <div className="right-pane">
      <div className="right-pane__tabs">
        <button
          className={cn("right-pane__tab", activeRightTab === "problems" && "right-pane__tab--active")}
          onClick={() => setActiveRightTab("problems")}
        >
          Problems
        </button>
        <button
          className={cn("right-pane__tab", activeRightTab === "extensions" && "right-pane__tab--active")}
          onClick={() => setActiveRightTab("extensions")}
        >
          Extensions
        </button>
        <button
          className={cn("right-pane__tab", activeRightTab === "ai" && "right-pane__tab--active")}
          onClick={() => setActiveRightTab("ai")}
        >
          ✨ AI Agent
        </button>
      </div>
      <div className="right-pane__content">
        {activeRightTab === "problems" && <ProblemsPanel projectId={projectId} />}
        {activeRightTab === "extensions" && <ExtensionsPanel />}
        {activeRightTab === "ai" && (
          <AIAgentSidebar projectId={projectId} activeFile={activeTabId} fileContent={fileContent} />
        )}
      </div>
    </div>
  )
}

// Workspace Layout
function Workspace() {
  const { id: projectId } = useParams()
  const showSidebar = useUIStore((state) => state.showSidebar)
  const showTerminal = useUIStore((state) => state.showTerminal)
  const showRightPane = useUIStore((state) => state.showRightPane)
  const setActiveRightTab = useUIStore((state) => state.setActiveRightTab)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault()
        setActiveRightTab("ai")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [setActiveRightTab])

  return (
    <div className="workspace">
      <div className="topbar">
        <div className="topbar__logo">CodeCollab</div>
        <div className="topbar__title">Project: {projectId}</div>
        <button className="topbar__ai-btn" onClick={() => setActiveRightTab("ai")} title="Ask AI (Ctrl/Cmd+I)">
          ✨
        </button>
      </div>

      <div className="workspace__main">
        {showSidebar && (
          <div className="sidebar">
            <div className="sidebar__tabs">
              <button className="sidebar__tab sidebar__tab--active">Files</button>
              <button className="sidebar__tab">Search</button>
            </div>
            <FileTree projectId={projectId} />
            <SearchPanel projectId={projectId} />
          </div>
        )}

        <div className="workspace__center">
          <Editor projectId={projectId} />
          {showTerminal && (
            <div className="workspace__terminal">
              <Terminal projectId={projectId} />
            </div>
          )}
        </div>

        {showRightPane && <RightPane projectId={projectId} />}
      </div>

      <StatusBar />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </div>
  )
}

// Project Selector
function ProjectSelector() {
  const navigate = useNavigate()
  const projects = [{ id: "demo", name: "Demo Project" }]

  return (
    <div className="project-selector">
      <h1 className="project-selector__title">Select a Project</h1>
      <div className="project-selector__list">
        {projects.map((project) => (
          <div key={project.id} className="project-selector__item" onClick={() => navigate(`/project/${project.id}`)}>
            <span className="project-selector__icon">📁</span>
            <span className="project-selector__name">{project.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main App
export default function App() {
  return (
    <WebSocketProvider>
      <Routes>
        <Route path="/" element={<ProjectSelector />} />
        <Route path="/project/:id" element={<Workspace />} />
      </Routes>
      <Toast />
    </WebSocketProvider>
  )
}
