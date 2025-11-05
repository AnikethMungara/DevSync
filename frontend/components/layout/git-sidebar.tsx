"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Plus,
  Minus,
  RefreshCw,
  Upload,
  Download,
  Check,
  X,
} from "lucide-react"

interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  unstaged: string[]
  untracked: string[]
}

export function GitSidebar() {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [commitMessage, setCommitMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const refreshStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8787/api/git/status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch git status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const stageFile = async (file: string) => {
    try {
      await fetch("http://localhost:8787/api/git/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [file] }),
      })
      refreshStatus()
    } catch (error) {
      console.error("Failed to stage file:", error)
    }
  }

  const unstageFile = async (file: string) => {
    try {
      await fetch("http://localhost:8787/api/git/unstage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [file] }),
      })
      refreshStatus()
    } catch (error) {
      console.error("Failed to unstage file:", error)
    }
  }

  const commit = async () => {
    if (!commitMessage.trim()) return

    try {
      await fetch("http://localhost:8787/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMessage }),
      })
      setCommitMessage("")
      refreshStatus()
    } catch (error) {
      console.error("Failed to commit:", error)
    }
  }

  const push = async () => {
    try {
      await fetch("http://localhost:8787/api/git/push", {
        method: "POST",
      })
      refreshStatus()
    } catch (error) {
      console.error("Failed to push:", error)
    }
  }

  const pull = async () => {
    try {
      await fetch("http://localhost:8787/api/git/pull", {
        method: "POST",
      })
      refreshStatus()
    } catch (error) {
      console.error("Failed to pull:", error)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <h2 className="font-semibold">Source Control</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshStatus}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Branch Info */}
          {status && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{status.branch}</span>
                </div>
                <div className="flex gap-1">
                  {status.ahead > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      {status.ahead}
                    </Badge>
                  )}
                  {status.behind > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      {status.behind}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Sync Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={pull}
                  disabled={loading}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Pull
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={push}
                  disabled={loading || status.ahead === 0}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Push
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Commit Section */}
          <div className="space-y-2">
            <Input
              placeholder="Commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  commit()
                }
              }}
            />
            <Button
              size="sm"
              className="w-full"
              onClick={commit}
              disabled={!commitMessage.trim() || loading}
            >
              <GitCommit className="h-3 w-3 mr-1" />
              Commit (Ctrl+Enter)
            </Button>
          </div>

          <Separator />

          {/* Staged Changes */}
          {status && status.staged.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Staged Changes</h3>
                <Badge variant="secondary">{status.staged.length}</Badge>
              </div>
              <div className="space-y-1">
                {status.staged.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="truncate">{file}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => unstageFile(file)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unstaged Changes */}
          {status && status.unstaged.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Changes</h3>
                <Badge variant="secondary">{status.unstaged.length}</Badge>
              </div>
              <div className="space-y-1">
                {status.unstaged.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GitCommit className="h-3 w-3 text-orange-500 shrink-0" />
                      <span className="truncate">{file}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => stageFile(file)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Untracked Files */}
          {status && status.untracked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Untracked Files</h3>
                <Badge variant="secondary">{status.untracked.length}</Badge>
              </div>
              <div className="space-y-1">
                {status.untracked.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <X className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{file}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => stageFile(file)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Changes */}
          {status &&
            status.staged.length === 0 &&
            status.unstaged.length === 0 &&
            status.untracked.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                No changes to commit
              </div>
            )}
        </div>
      </ScrollArea>
    </div>
  )
}
