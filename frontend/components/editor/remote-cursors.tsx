"use client"

import { useEffect, useState } from "react"
import { Cursor, CollaborationUser } from "@/hooks/use-collaboration"

interface RemoteCursorsProps {
  cursors: Cursor[]
  users: CollaborationUser[]
  currentFile: string
  myUserId: string | null
}

export function RemoteCursors({ cursors, users, currentFile, myUserId }: RemoteCursorsProps) {
  const [displayCursors, setDisplayCursors] = useState<
    Array<Cursor & { user: CollaborationUser }>
  >([])

  useEffect(() => {
    // Filter cursors for current file and exclude self
    const relevantCursors = cursors
      .filter((cursor) => cursor.file_path === currentFile && cursor.user_id !== myUserId)
      .map((cursor) => {
        const user = users.find((u) => u.id === cursor.user_id)
        return user ? { ...cursor, user } : null
      })
      .filter((cursor): cursor is Cursor & { user: CollaborationUser } => cursor !== null)

    setDisplayCursors(relevantCursors)
  }, [cursors, users, currentFile, myUserId])

  return (
    <>
      {displayCursors.map((cursor) => (
        <div
          key={cursor.user_id}
          className="absolute pointer-events-none z-10"
          style={{
            // Position will be calculated by Monaco editor integration
            // This is a placeholder component
          }}
        >
          <div
            className="w-0.5 h-5"
            style={{ backgroundColor: cursor.user.color }}
          />
          <div
            className="text-xs px-1 py-0.5 rounded text-white whitespace-nowrap"
            style={{ backgroundColor: cursor.user.color }}
          >
            {cursor.user.name}
          </div>
        </div>
      ))}
    </>
  )
}
