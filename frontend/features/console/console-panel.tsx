"use client"

import type React from "react"

import { useState } from "react"
import { Terminal, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ConsoleMessage {
  id: string
  type: "log" | "error" | "warn" | "info"
  content: string
  timestamp: string
}

export function ConsolePanel() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([])
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          type: "log",
          content: `> ${input}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      setInput("")
    }
  }

  const clearConsole = () => setMessages([])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">Console</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-text-secondary hover:text-text-primary"
          onClick={clearConsole}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 py-1 hover:bg-panel-border/50">
            <span className="text-text-muted flex-shrink-0">{msg.timestamp}</span>
            <span
              className={
                msg.type === "error"
                  ? "text-error"
                  : msg.type === "warn"
                    ? "text-warning"
                    : msg.type === "info"
                      ? "text-accent-blue"
                      : "text-text-primary"
              }
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-panel-border p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          className="h-8 bg-canvas border-panel-border text-text-primary placeholder:text-text-muted font-mono text-xs"
        />
      </form>
    </div>
  )
}
