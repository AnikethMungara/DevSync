"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, File, CommandIcon, Zap, Settings, GitBranch } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { sortByFuzzyScore } from "@/lib/utils/fuzzy"

interface CommandItem {
  id: string
  label: string
  description?: string
  category: "file" | "command" | "agent" | "recent"
  icon?: React.ReactNode
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (path: string) => void
}

export function CommandPalette({ open, onOpenChange, onFileSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mock commands and files
  const allCommands: CommandItem[] = [
    // Commands
    {
      id: "cmd-new-file",
      label: "New File",
      description: "Create a new file",
      category: "command",
      icon: <File className="w-4 h-4" />,
      action: () => console.log("New file"),
    },
    {
      id: "cmd-split",
      label: "Split Editor",
      description: "Split the editor vertically",
      category: "command",
      icon: <CommandIcon className="w-4 h-4" />,
      action: () => console.log("Split editor"),
    },
    {
      id: "cmd-settings",
      label: "Open Settings",
      description: "Open workspace settings",
      category: "command",
      icon: <Settings className="w-4 h-4" />,
      action: () => console.log("Open settings"),
    },
    {
      id: "cmd-git",
      label: "Git: Commit",
      description: "Commit staged changes",
      category: "command",
      icon: <GitBranch className="w-4 h-4" />,
      action: () => console.log("Git commit"),
    },
    // Files
    {
      id: "file-app",
      label: "App.tsx",
      description: "/src/components/App.tsx",
      category: "file",
      icon: <File className="w-4 h-4 text-accent-blue" />,
      action: () => onFileSelect("/src/components/App.tsx"),
    },
    {
      id: "file-header",
      label: "Header.tsx",
      description: "/src/components/Header.tsx",
      category: "file",
      icon: <File className="w-4 h-4 text-accent-blue" />,
      action: () => onFileSelect("/src/components/Header.tsx"),
    },
    {
      id: "file-utils",
      label: "utils.ts",
      description: "/src/lib/utils.ts",
      category: "file",
      icon: <File className="w-4 h-4 text-accent-blue" />,
      action: () => onFileSelect("/src/lib/utils.ts"),
    },
    {
      id: "file-readme",
      label: "README.md",
      description: "/README.md",
      category: "file",
      icon: <File className="w-4 h-4 text-accent-blue" />,
      action: () => onFileSelect("/README.md"),
    },
    // Agent actions
    {
      id: "agent-explain",
      label: "AI: Explain Code",
      description: "Ask AI to explain the selected code",
      category: "agent",
      icon: <Zap className="w-4 h-4 text-warning" />,
      action: () => console.log("AI explain"),
    },
    {
      id: "agent-refactor",
      label: "AI: Refactor",
      description: "Ask AI to refactor the code",
      category: "agent",
      icon: <Zap className="w-4 h-4 text-warning" />,
      action: () => console.log("AI refactor"),
    },
  ]

  const filteredCommands = sortByFuzzyScore(allCommands, query, (item) => item.label)

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const selected = filteredCommands[selectedIndex]
      if (selected) {
        selected.action()
        onOpenChange(false)
      }
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "file":
        return "Files"
      case "command":
        return "Commands"
      case "agent":
        return "AI Actions"
      case "recent":
        return "Recent"
      default:
        return category
    }
  }

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = []
      acc[cmd.category].push(cmd)
      return acc
    },
    {} as Record<string, CommandItem[]>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl bg-panel border-panel-border overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-panel-border">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files, commands, and actions..."
            className="border-0 bg-transparent text-text-primary placeholder:text-text-muted focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-base"
          />
          <kbd className="px-2 py-1 text-xs bg-canvas border border-panel-border rounded text-text-muted">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-secondary text-sm">No results found</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-4 py-1">
                    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {getCategoryLabel(category)}
                    </h3>
                  </div>
                  {items.map((item, index) => {
                    const globalIndex = filteredCommands.indexOf(item)
                    const isSelected = globalIndex === selectedIndex

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.action()
                          onOpenChange(false)
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          isSelected ? "bg-selection" : "hover:bg-panel-border/50"
                        }`}
                      >
                        <div className="flex-shrink-0 text-text-secondary">{item.icon}</div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm text-text-primary font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-text-muted truncate">{item.description}</div>
                          )}
                        </div>
                        {isSelected && (
                          <kbd className="px-2 py-1 text-xs bg-canvas border border-panel-border rounded text-text-muted flex-shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-panel-border bg-canvas">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-panel border border-panel-border rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-panel border border-panel-border rounded">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-panel border border-panel-border rounded">↵</kbd>
              <span>Select</span>
            </div>
          </div>
          <span className="text-xs text-text-muted">{filteredCommands.length} results</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
