"use client"

import { useEffect, useRef } from "react"
import type { EditorTab } from "@/lib/types"

interface EditorPaneProps {
  tab: EditorTab | null
  onContentChange?: (content: string) => void
}

export function EditorPane({ tab, onContentChange }: EditorPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current && tab) {
      // Set cursor position to end when tab changes
      textareaRef.current.setSelectionRange(tab.content.length, tab.content.length)
    }
  }, [tab?.id])

  if (!tab) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas">
        <div className="text-center">
          <p className="text-text-secondary text-lg mb-2">No file open</p>
          <p className="text-text-muted text-sm">Open a file from the explorer or create a new one</p>
          <div className="mt-6 flex gap-2 justify-center text-xs text-text-muted">
            <kbd className="px-2 py-1 bg-panel border border-panel-border rounded">⌘N</kbd>
            <span>New File</span>
            <span className="mx-2">•</span>
            <kbd className="px-2 py-1 bg-panel border border-panel-border rounded">⌘O</kbd>
            <span>Open File</span>
          </div>
        </div>
      </div>
    )
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    onContentChange?.(newContent)
  }

  return (
    <div className="h-full bg-canvas overflow-hidden flex flex-col">
      <textarea
        ref={textareaRef}
        value={tab.content}
        onChange={handleContentChange}
        className="flex-1 w-full p-4 text-sm font-mono text-text-primary bg-canvas border-none outline-none resize-none"
        style={{
          tabSize: 2,
          lineHeight: "1.6",
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  )
}
