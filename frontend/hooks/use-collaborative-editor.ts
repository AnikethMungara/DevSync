/**
 * Hook for collaborative editor with real-time synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCollaboration } from './use-collaboration'
import { diffTexts, applyOperation, transformCursorPosition, getLineColumn, getCursorPosition } from '@/lib/utils/text-sync'
import type { TextOperation } from '@/lib/utils/text-sync'

export interface UseCollaborativeEditorOptions {
  sessionId: string | null
  userName: string
  filePath: string | null
  initialContent: string
  onContentChange?: (content: string) => void
  enabled?: boolean
}

export interface RemoteCursor {
  userId: string
  userName: string
  userColor: string
  line: number
  column: number
  timestamp: string
}

export function useCollaborativeEditor(options: UseCollaborativeEditorOptions) {
  const {
    sessionId,
    userName,
    filePath,
    initialContent,
    onContentChange,
    enabled = true,
  } = options

  const [content, setContent] = useState(initialContent)
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map())
  const [isApplyingRemoteChange, setIsApplyingRemoteChange] = useState(false)

  const previousContentRef = useRef(initialContent)
  const contentRef = useRef(initialContent)
  const cursorPositionRef = useRef(0)

  // Update content when initial content changes (e.g., switching tabs)
  useEffect(() => {
    setContent(initialContent)
    previousContentRef.current = initialContent
    contentRef.current = initialContent
  }, [initialContent])

  // Collaboration callbacks
  const handleCursorUpdate = useCallback((cursor: any) => {
    if (!filePath || cursor.file_path !== filePath) return

    setRemoteCursors((prev) => {
      const next = new Map(prev)
      next.set(cursor.user_id, {
        userId: cursor.user_id,
        userName: '', // Will be populated from session state
        userColor: '',
        line: cursor.line,
        column: cursor.column,
        timestamp: cursor.timestamp,
      })
      return next
    })
  }, [filePath])

  const handleDocumentEdit = useCallback((message: any) => {
    if (!filePath || message.file_path !== filePath) return

    setIsApplyingRemoteChange(true)

    try {
      const operation: TextOperation = message.data.operation

      // Apply the remote operation to current content
      const newContent = applyOperation(contentRef.current, operation)

      // Update cursor position based on the operation
      const newCursorPos = transformCursorPosition(cursorPositionRef.current, operation)
      cursorPositionRef.current = newCursorPos

      // Update content
      contentRef.current = newContent
      previousContentRef.current = newContent
      setContent(newContent)

      // Notify parent component
      if (onContentChange) {
        onContentChange(newContent)
      }
    } catch (error) {
      console.error('Failed to apply remote edit:', error)
    } finally {
      setIsApplyingRemoteChange(false)
    }
  }, [filePath, onContentChange])

  const handleUserJoined = useCallback((user: any) => {
    console.log('User joined:', user.name)
  }, [])

  const handleUserLeft = useCallback((userId: string) => {
    setRemoteCursors((prev) => {
      const next = new Map(prev)
      next.delete(userId)
      return next
    })
  }, [])

  // Initialize collaboration
  const collaboration = useCollaboration({
    sessionId: enabled ? sessionId : null,
    userName,
    onCursorUpdate: handleCursorUpdate,
    onDocumentEdit: handleDocumentEdit,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
  })

  // Update remote cursors with user info from session state
  useEffect(() => {
    if (!collaboration.sessionState) return

    setRemoteCursors((prev) => {
      const next = new Map(prev)

      // Update user info for each cursor
      collaboration.sessionState.cursors.forEach((cursor) => {
        const user = collaboration.sessionState.users.find(u => u.id === cursor.user_id)
        if (user && cursor.user_id !== collaboration.myUserId) {
          next.set(cursor.user_id, {
            userId: cursor.user_id,
            userName: user.name,
            userColor: user.color,
            line: cursor.line,
            column: cursor.column,
            timestamp: cursor.timestamp,
          })
        }
      })

      return next
    })
  }, [collaboration.sessionState, collaboration.myUserId])

  // Handle local content changes
  const handleLocalContentChange = useCallback((newContent: string, cursorPosition: number) => {
    // Skip if this is a remote change being applied
    if (isApplyingRemoteChange) return

    // Update refs
    cursorPositionRef.current = cursorPosition
    contentRef.current = newContent

    // Calculate diff and broadcast changes
    if (collaboration.isConnected && filePath && enabled) {
      const operations = diffTexts(previousContentRef.current, newContent)

      if (operations.length > 0) {
        // Broadcast each operation
        operations.forEach((operation) => {
          collaboration.broadcastEdit(filePath, 'edit', { operation })
        })
      }
    }

    // Update previous content
    previousContentRef.current = newContent

    // Update state
    setContent(newContent)

    // Notify parent
    if (onContentChange) {
      onContentChange(newContent)
    }
  }, [collaboration, filePath, enabled, isApplyingRemoteChange, onContentChange])

  // Handle cursor position changes
  const handleCursorChange = useCallback((cursorPosition: number) => {
    if (!collaboration.isConnected || !filePath || !enabled) return

    cursorPositionRef.current = cursorPosition

    // Convert cursor position to line/column
    const { line, column } = getLineColumn(contentRef.current, cursorPosition)

    // Broadcast cursor update
    collaboration.updateCursor(filePath, line, column)
  }, [collaboration, filePath, enabled])

  // Debounced cursor update
  const debouncedCursorUpdateRef = useRef<NodeJS.Timeout>()
  const handleCursorChangeDebounced = useCallback((cursorPosition: number) => {
    if (debouncedCursorUpdateRef.current) {
      clearTimeout(debouncedCursorUpdateRef.current)
    }

    debouncedCursorUpdateRef.current = setTimeout(() => {
      handleCursorChange(cursorPosition)
    }, 100)
  }, [handleCursorChange])

  return {
    content,
    remoteCursors: Array.from(remoteCursors.values()),
    isConnected: collaboration.isConnected,
    sessionState: collaboration.sessionState,
    myUserId: collaboration.myUserId,
    handleLocalContentChange,
    handleCursorChange: handleCursorChangeDebounced,
    error: collaboration.error,
  }
}
