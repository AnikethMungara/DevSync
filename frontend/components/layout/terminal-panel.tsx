"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal as TerminalIcon, X, Plus, Trash2 } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

interface TerminalOutput {
  type: "command" | "output" | "error"
  content: string
  timestamp: number
}

interface TerminalSession {
  id: string
  cwd: string
  history: TerminalOutput[]
  ws: WebSocket | null
}

export function TerminalPanel() {
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [command, setCommand] = useState("")
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  // Auto-scroll to bottom when new output appears
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [activeSession?.history])

  // Create a new terminal session
  const createSession = () => {
    const sessionId = `terminal-${Date.now()}`

    // Create WebSocket connection
    const wsUrl = `${BACKEND_URL.replace("http", "ws")}/api/terminal/ws/${sessionId}`
    const ws = new WebSocket(wsUrl)

    const newSession: TerminalSession = {
      id: sessionId,
      cwd: ".",
      history: [],
      ws,
    }

    ws.onopen = () => {
      console.log("Terminal WebSocket connected")
      addOutput(sessionId, "output", "Terminal session started. Type commands below.")
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case "welcome":
          updateCwd(sessionId, message.cwd)
          break

        case "output":
          if (message.stdout) {
            addOutput(sessionId, "output", message.stdout)
          }
          if (message.stderr) {
            addOutput(sessionId, "error", message.stderr)
          }
          break

        case "error":
          addOutput(sessionId, "error", message.message)
          break

        case "cwd_changed":
          updateCwd(sessionId, message.cwd)
          addOutput(sessionId, "output", `Changed directory to: ${message.cwd}`)
          break

        case "clear":
          clearSession(sessionId)
          break
      }
    }

    ws.onerror = (error) => {
      console.error("Terminal WebSocket error:", error)
      addOutput(sessionId, "error", "WebSocket connection error")
    }

    ws.onclose = () => {
      console.log("Terminal WebSocket closed")
      addOutput(sessionId, "error", "Connection closed")
      // Mark WebSocket as null
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, ws: null } : s
        )
      )
    }

    setSessions((prev) => [...prev, newSession])
    setActiveSessionId(sessionId)
  }

  const addOutput = (sessionId: string, type: "output" | "error", content: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              history: [
                ...s.history,
                { type, content, timestamp: Date.now() },
              ],
            }
          : s
      )
    )
  }

  const updateCwd = (sessionId: string, cwd: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, cwd } : s))
    )
  }

  const clearSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, history: [] } : s
      )
    )
  }

  const closeSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session?.ws) {
      session.ws.close()
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    // Switch to another session if current was closed
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId)
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const executeCommand = () => {
    if (!command.trim() || !activeSession?.ws) return

    // Add to command history
    setCommandHistory((prev) => [...prev, command.trim()])

    // Add command to history
    addOutput(activeSession.id, "command", `$ ${command}`)

    // Send command via WebSocket
    activeSession.ws.send(
      JSON.stringify({
        type: "execute",
        command: command.trim(),
      })
    )

    setCommand("")
    setHistoryIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      // Navigate backward through command history
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommand(commandHistory[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      // Navigate forward through command history
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCommand("")
        } else {
          setHistoryIndex(newIndex)
          setCommand(commandHistory[newIndex])
        }
      }
    } else if (e.key === "c" && e.ctrlKey) {
      // Ctrl+C - Cancel current command
      e.preventDefault()
      setCommand("")
      setHistoryIndex(-1)
    } else if (e.key === "l" && e.ctrlKey) {
      // Ctrl+L - Clear terminal
      e.preventDefault()
      if (activeSession) {
        clearSession(activeSession.id)
      }
    }
  }

  // Create initial session on mount
  useEffect(() => {
    if (sessions.length === 0) {
      createSession()
    }
  }, [])

  // Auto-focus input when active session changes
  useEffect(() => {
    if (activeSessionId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeSessionId])

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Terminal Tabs */}
      <div className="flex items-center gap-1 bg-[#252526] border-b border-[#3e3e42] px-2 py-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer ${
              activeSessionId === session.id
                ? "bg-[#1e1e1e] text-white"
                : "bg-[#2d2d30] text-gray-400 hover:bg-[#353537]"
            }`}
            onClick={() => setActiveSessionId(session.id)}
          >
            <TerminalIcon className="h-3 w-3" />
            <span className="text-xs">bash</span>
            <button
              className="hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                closeSession(session.id)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#353537]"
          onClick={createSession}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Terminal Output */}
      {activeSession ? (
        <>
          <ScrollArea className="flex-1 p-4 font-mono text-sm" ref={terminalRef}>
            <div className="space-y-1">
              {activeSession.history.map((item, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {item.type === "command" && (
                    <div className="text-green-400">{item.content}</div>
                  )}
                  {item.type === "output" && (
                    <div className="text-gray-200">{item.content}</div>
                  )}
                  {item.type === "error" && (
                    <div className="text-red-400">{item.content}</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Command Input */}
          <div className="border-t border-[#3e3e42] p-2 bg-[#1e1e1e]">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-mono text-xs">{activeSession.cwd}</span>
              <span className="text-green-400 font-mono text-sm">$</span>
              <Input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="flex-1 bg-transparent border-none focus:ring-0 font-mono text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TerminalIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No terminal sessions</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={createSession}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Terminal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
