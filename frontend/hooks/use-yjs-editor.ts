/**
 * Yjs-based collaborative editor hook
 * Production-ready CRDT implementation for conflict-free editing
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787'

export interface UseYjsEditorOptions {
  sessionId: string | null
  filePath: string | null
  userName: string
  userColor?: string
  token?: string
  enabled?: boolean
  onContentChange?: (content: string) => void
  onUsersChange?: (users: Map<number, any>) => void
}

export interface YjsUser {
  clientId: number
  name: string
  color: string
  cursor?: {
    anchor: number
    head: number
  }
}

export function useYjsEditor(options: UseYjsEditorOptions) {
  const {
    sessionId,
    filePath,
    userName,
    userColor = '#' + Math.floor(Math.random() * 16777215).toString(16),
    token,
    enabled = true,
    onContentChange,
    onUsersChange,
  } = options

  const [content, setContent] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<Map<number, YjsUser>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const textRef = useRef<Y.Text | null>(null)
  const isLocalChangeRef = useRef(false)

  // Initialize Yjs document and WebSocket provider
  useEffect(() => {
    if (!enabled || !sessionId || !filePath) {
      return
    }

    // Create Yjs document
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    // Get the shared text type
    const ytext = ydoc.getText('content')
    textRef.current = ytext

    // Build WebSocket URL for Yjs
    const wsUrl = new URL(`/api/collaboration/yjs/${sessionId}`, BACKEND_URL)
    wsUrl.protocol = wsUrl.protocol.replace('http', 'ws')

    // Add authentication token if provided
    const params = new URLSearchParams({
      file: filePath,
      user: userName,
      color: userColor,
    })
    if (token) {
      params.set('token', token)
    }
    wsUrl.search = params.toString()

    // Create WebSocket provider
    const provider = new WebsocketProvider(
      wsUrl.toString().replace('ws://', '').replace('wss://', ''),
      filePath,
      ydoc,
      {
        connect: true,
        params: {
          user: userName,
          color: userColor,
          token: token || '',
        },
      }
    )

    providerRef.current = provider

    // Set up awareness (user presence)
    const awareness = provider.awareness
    awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
    })

    // Listen for content changes
    const handleTextChange = () => {
      if (!isLocalChangeRef.current) {
        const newContent = ytext.toString()
        setContent(newContent)
        if (onContentChange) {
          onContentChange(newContent)
        }
      }
      isLocalChangeRef.current = false
    }

    ytext.observe(handleTextChange)

    // Listen for awareness changes (user presence)
    const handleAwarenessChange = () => {
      const states = awareness.getStates()
      const usersMap = new Map<number, YjsUser>()

      states.forEach((state, clientId) => {
        if (state.user && clientId !== awareness.clientID) {
          usersMap.set(clientId, {
            clientId,
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor,
          })
        }
      })

      setUsers(usersMap)
      if (onUsersChange) {
        onUsersChange(usersMap)
      }
    }

    awareness.on('change', handleAwarenessChange)

    // Listen for connection status
    provider.on('status', (event: { status: string }) => {
      setIsConnected(event.status === 'connected')
      if (event.status === 'connected') {
        setError(null)
      }
    })

    provider.on('connection-error', (err: Error) => {
      setError(err.message || 'Connection error')
      setIsConnected(false)
    })

    // Initial sync
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        const initialContent = ytext.toString()
        setContent(initialContent)
        if (onContentChange) {
          onContentChange(initialContent)
        }
      }
    })

    // Cleanup
    return () => {
      ytext.unobserve(handleTextChange)
      awareness.off('change', handleAwarenessChange)
      provider.destroy()
      ydoc.destroy()
    }
  }, [sessionId, filePath, userName, userColor, token, enabled, onContentChange, onUsersChange])

  // Update text content
  const updateContent = useCallback((newContent: string, cursorPosition?: number) => {
    if (!textRef.current) return

    const ytext = textRef.current
    const currentContent = ytext.toString()

    if (currentContent !== newContent) {
      isLocalChangeRef.current = true

      // Perform transaction to update text
      ydocRef.current?.transact(() => {
        // Delete all and insert new (simple approach)
        // For better performance, consider using a diff algorithm
        ytext.delete(0, ytext.length)
        ytext.insert(0, newContent)
      })

      setContent(newContent)
    }

    // Update cursor position in awareness
    if (cursorPosition !== undefined && providerRef.current) {
      const awareness = providerRef.current.awareness
      awareness.setLocalStateField('cursor', {
        anchor: cursorPosition,
        head: cursorPosition,
      })
    }
  }, [])

  // Update cursor position only
  const updateCursor = useCallback((cursorPosition: number) => {
    if (!providerRef.current) return

    const awareness = providerRef.current.awareness
    awareness.setLocalStateField('cursor', {
      anchor: cursorPosition,
      head: cursorPosition,
    })
  }, [])

  // Get users array
  const usersArray = Array.from(users.values())

  return {
    content,
    isConnected,
    users: usersArray,
    error,
    updateContent,
    updateCursor,
    ydoc: ydocRef.current,
    provider: providerRef.current,
  }
}
