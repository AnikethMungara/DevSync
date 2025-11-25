"use client"

import { useState } from 'react'
import { Users, Share2, Copy, Check } from 'lucide-react'

interface CollaborationPanelProps {
  sessionId: string | null
  isConnected: boolean
  userCount: number
  users: Array<{
    id: string
    name: string
    color: string
  }>
  onCreateSession?: () => void
  onLeaveSession?: () => void
}

export function CollaborationPanel({
  sessionId,
  isConnected,
  userCount,
  users,
  onCreateSession,
  onLeaveSession,
}: CollaborationPanelProps) {
  const [copied, setCopied] = useState(false)

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!sessionId) {
    return (
      <div className="p-4 border-b border-panel-border bg-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-secondary">Collaboration</span>
          </div>
          <button
            onClick={onCreateSession}
            className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
          >
            Start Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-panel-border bg-panel">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-text-primary">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={onLeaveSession}
            className="px-3 py-1.5 text-xs font-medium bg-panel-hover text-text-secondary rounded-md hover:bg-panel-border transition-colors"
          >
            Leave
          </button>
        </div>

        {/* Session ID */}
        <div className="flex items-center gap-2 p-2 bg-canvas rounded-md border border-panel-border">
          <Share2 className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <code className="flex-1 text-xs text-text-secondary font-mono truncate">
            {sessionId}
          </code>
          <button
            onClick={copySessionId}
            className="p-1 hover:bg-panel-hover rounded transition-colors"
            title="Copy session ID"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-text-muted" />
            )}
          </button>
        </div>

        {/* Active users */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Users className="w-3.5 h-3.5" />
            <span>{userCount} active user{userCount !== 1 ? 's' : ''}</span>
          </div>

          {users.length > 0 && (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-canvas"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-xs text-text-secondary">{user.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
