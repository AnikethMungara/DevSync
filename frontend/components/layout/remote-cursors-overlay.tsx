"use client"

import { useMemo } from 'react'
import type { RemoteCursor } from '@/hooks/use-collaborative-editor'
import { getCursorPosition } from '@/lib/utils/text-sync'

interface RemoteCursorsOverlayProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  remoteCursors: RemoteCursor[]
  content: string
}

export function RemoteCursorsOverlay({
  textareaRef,
  remoteCursors,
  content,
}: RemoteCursorsOverlayProps) {
  const cursorPositions = useMemo(() => {
    if (!textareaRef.current) return []

    const textarea = textareaRef.current
    const computedStyle = window.getComputedStyle(textarea)
    const lineHeight = parseFloat(computedStyle.lineHeight)
    const fontSize = parseFloat(computedStyle.fontSize)
    const paddingTop = parseFloat(computedStyle.paddingTop)
    const paddingLeft = parseFloat(computedStyle.paddingLeft)

    return remoteCursors.map((cursor) => {
      // Calculate pixel position from line and column
      const top = paddingTop + cursor.line * lineHeight

      // Approximate column position (this is simplified)
      // For better accuracy, we'd need to measure actual text width
      const charWidth = fontSize * 0.6 // Monospace approximation
      const left = paddingLeft + cursor.column * charWidth

      return {
        cursor,
        top,
        left,
      }
    })
  }, [remoteCursors, textareaRef, content])

  if (!textareaRef.current) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursorPositions.map(({ cursor, top, left }) => (
        <div
          key={cursor.userId}
          className="absolute"
          style={{
            top: `${top}px`,
            left: `${left}px`,
          }}
        >
          {/* Cursor line */}
          <div
            className="w-0.5 h-5 animate-pulse"
            style={{
              backgroundColor: cursor.userColor,
            }}
          />

          {/* User label */}
          <div
            className="absolute top-0 left-1 whitespace-nowrap text-xs font-medium px-1.5 py-0.5 rounded shadow-sm"
            style={{
              backgroundColor: cursor.userColor,
              color: '#fff',
            }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  )
}
