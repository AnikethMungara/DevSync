/**
 * Hook for managing real-time collaboration
 */

import { useState, useEffect, useCallback, useRef } from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export interface CollaborationUser {
  id: string
  name: string
  color: string
  avatar?: string
}

export interface Cursor {
  user_id: string
  file_path: string
  line: number
  column: number
  timestamp: string
}

export interface Selection {
  user_id: string
  file_path: string
  start_line: number
  start_column: number
  end_line: number
  end_column: number
}

export interface ChatMessage {
  user_id: string
  user_name: string
  user_color: string
  message: string
  timestamp: string
}

export interface SessionState {
  session_id: string
  users: CollaborationUser[]
  cursors: Cursor[]
  selections: Selection[]
  document_versions: Record<string, number>
  user_count: number
}

export interface UseCollaborationOptions {
  sessionId: string | null
  userName: string
  userColor?: string
  onCursorUpdate?: (cursor: Cursor) => void
  onSelectionUpdate?: (selection: Selection) => void
  onDocumentEdit?: (edit: any) => void
  onUserJoined?: (user: CollaborationUser) => void
  onUserLeft?: (userId: string) => void
  onChatMessage?: (message: ChatMessage) => void
}

export function useCollaboration(options: UseCollaborationOptions) {
  const {
    sessionId,
    userName,
    userColor,
    onCursorUpdate,
    onSelectionUpdate,
    onDocumentEdit,
    onUserJoined,
    onUserLeft,
    onChatMessage,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [sessionState, setSessionState] = useState<SessionState | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (!sessionId || !userName) return

    try {
      // Build WebSocket URL
      const wsUrl = new URL(`/api/collaboration/sessions/${sessionId}/ws`, BACKEND_URL)
      wsUrl.protocol = wsUrl.protocol.replace("http", "ws")
      wsUrl.searchParams.set("user_name", userName)
      if (userColor) {
        wsUrl.searchParams.set("user_color", userColor)
      }

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl.toString())

      ws.onopen = () => {
        console.log("Connected to collaboration session:", sessionId)
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          switch (message.type) {
            case "session_state":
              setSessionState(message.data)
              setMyUserId(message.your_user_id)
              break

            case "user_joined":
              if (onUserJoined) {
                onUserJoined(message.user)
              }
              break

            case "user_left":
              if (onUserLeft) {
                onUserLeft(message.user_id)
              }
              break

            case "cursor_update":
              if (onCursorUpdate) {
                onCursorUpdate(message.cursor)
              }
              break

            case "selection_update":
              if (onSelectionUpdate) {
                onSelectionUpdate(message.selection)
              }
              break

            case "document_edit":
              if (onDocumentEdit) {
                onDocumentEdit(message)
              }
              break

            case "chat_message":
              if (onChatMessage) {
                onChatMessage(message)
              }
              break

            case "pong":
              // Heartbeat response
              break

            default:
              console.log("Unknown message type:", message.type)
          }
        } catch (err) {
          console.error("Failed to parse message:", err)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("Connection error")
      }

      ws.onclose = () => {
        console.log("Disconnected from collaboration session")
        setIsConnected(false)

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
            connect()
          }, delay)
        } else {
          setError("Failed to reconnect after multiple attempts")
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error("Failed to create WebSocket:", err)
      setError("Failed to connect")
    }
  }, [sessionId, userName, userColor, onCursorUpdate, onSelectionUpdate, onDocumentEdit, onUserJoined, onUserLeft, onChatMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const updateCursor = useCallback((filePath: string, line: number, column: number) => {
    sendMessage({
      type: "cursor_update",
      file_path: filePath,
      line,
      column,
    })
  }, [sendMessage])

  const updateSelection = useCallback(
    (filePath: string, startLine: number, startColumn: number, endLine: number, endColumn: number) => {
      sendMessage({
        type: "selection_update",
        file_path: filePath,
        start_line: startLine,
        start_column: startColumn,
        end_line: endLine,
        end_column: endColumn,
      })
    },
    [sendMessage]
  )

  const broadcastEdit = useCallback((filePath: string, operation: string, data: any) => {
    sendMessage({
      type: "document_edit",
      file_path: filePath,
      operation,
      data,
    })
  }, [sendMessage])

  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      type: "chat_message",
      message,
      timestamp: new Date().toISOString(),
    })
  }, [sendMessage])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (sessionId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [sessionId, connect, disconnect])

  // Periodic ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      sendMessage({ type: "ping" })
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, sendMessage])

  return {
    isConnected,
    sessionState,
    myUserId,
    error,
    connect,
    disconnect,
    updateCursor,
    updateSelection,
    broadcastEdit,
    sendChatMessage,
  }
}
