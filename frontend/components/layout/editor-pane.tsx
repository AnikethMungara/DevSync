"use client"

import { useEffect, useRef, useState } from "react"
import type { EditorTab } from "@/lib/types"
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor"
import { RemoteCursorsOverlay } from "./remote-cursors-overlay"

interface EditorPaneProps {
  tab: EditorTab | null
  onContentChange?: (content: string) => void
  sessionId?: string | null
  userName?: string
  collaborationEnabled?: boolean
}

export function EditorPane({
  tab,
  onContentChange,
  sessionId = null,
  userName = 'Anonymous',
  collaborationEnabled = false
}: EditorPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(tab?.content || '')

  const collaboration = useCollaborativeEditor({
    sessionId,
    userName,
    filePath: tab?.path || null,
    initialContent: tab?.content || '',
    onContentChange: (newContent) => {
      setLocalContent(newContent)
      onContentChange?.(newContent)
    },
    enabled: collaborationEnabled,
  })

  useEffect(() => {
    if (tab) {
      setLocalContent(tab.content)
    }
  }, [tab?.id, tab?.content])

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
    const cursorPosition = e.target.selectionStart

    setLocalContent(newContent)

    if (collaborationEnabled) {
      collaboration.handleLocalContentChange(newContent, cursorPosition)
    } else {
      onContentChange?.(newContent)
    }
  }

  const handleCursorMove = () => {
    if (textareaRef.current && collaborationEnabled) {
      const cursorPosition = textareaRef.current.selectionStart
      collaboration.handleCursorChange(cursorPosition)
    }
  }

  const displayContent = collaborationEnabled ? collaboration.content : localContent

  return (
    <div className="h-full bg-canvas overflow-hidden flex flex-col relative">
      {collaborationEnabled && collaboration.isConnected && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-md">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-500 font-medium">
            {collaboration.sessionState?.user_count || 0} user{(collaboration.sessionState?.user_count || 0) !== 1 ? 's' : ''} online
          </span>
        </div>
      )}

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={displayContent}
          onChange={handleContentChange}
          onSelect={handleCursorMove}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          className="flex-1 w-full h-full p-4 text-sm font-mono text-text-primary bg-canvas border-none outline-none resize-none"
          style={{
            tabSize: 2,
            lineHeight: "1.6",
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />

        {collaborationEnabled && textareaRef.current && (
          <RemoteCursorsOverlay
            textareaRef={textareaRef}
            remoteCursors={collaboration.remoteCursors}
            content={displayContent}
          />
        )}
      </div>
    </div>
  )
}
