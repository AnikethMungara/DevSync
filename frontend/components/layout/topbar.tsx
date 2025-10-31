"use client"

import { Command, Play, GitBranch, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopbarProps {
  onCommandPaletteOpen?: () => void
  onRun?: () => void
  isRunning?: boolean
}

export function Topbar({ onCommandPaletteOpen, onRun, isRunning }: TopbarProps) {
  return (
    <div className="h-10 bg-panel border-b border-panel-border flex items-center px-4 gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text-primary">DevSync</span>
        <span className="text-xs text-text-muted">v1.0.0</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-2 text-text-secondary hover:text-text-primary"
          onClick={onCommandPaletteOpen}
        >
          <Command className="w-3.5 h-3.5" />
          <span className="text-xs">Command Palette</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-panel-border rounded">⌘K</kbd>
        </Button>

        <div className="w-px h-4 bg-panel-border" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-text-secondary hover:text-text-primary disabled:opacity-50"
          onClick={onRun}
          disabled={isRunning}
          title="Run code (Ctrl+Enter)"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-text-primary">
          <GitBranch className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-text-primary">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
