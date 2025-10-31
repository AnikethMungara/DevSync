"use client"

import { useState } from "react"
import { Play, Trash2, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useExecutionStore } from "@/lib/state/execution-store"
import type { ExecutionHistoryItem } from "@/lib/state/execution-store"

export function ExecutionPanel() {
  const { history, isExecuting, clearHistory, removeHistoryItem } = useExecutionStore()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStatusIcon = (item: ExecutionHistoryItem) => {
    if (item.result.success && item.result.result?.success) {
      return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
    } else if (!item.result.success || item.result.error) {
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
    } else {
      return <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return "0ms"
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary">Execution Output</span>
          {isExecuting && (
            <span className="text-xs text-accent-blue animate-pulse">Running...</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-text-secondary hover:text-text-primary"
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted">
            <Play className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No executions yet</p>
            <p className="text-xs mt-1">Click the Run button to execute code</p>
          </div>
        ) : (
          <div className="divide-y divide-panel-border">
            {history.map((item) => {
              const isExpanded = expandedItems.has(item.id)
              const hasOutput = item.result.result?.stdout || item.result.result?.stderr
              const hasError = item.result.error || !item.result.success || !item.result.result?.success

              return (
                <div key={item.id} className="bg-panel hover:bg-panel-border/30">
                  <div
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    {hasOutput || hasError ? (
                      isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                      )
                    ) : (
                      <div className="w-3" />
                    )}

                    {getStatusIcon(item)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-primary font-mono truncate">
                          {item.filePath || "Inline code"}
                        </span>
                        <span className="text-xs text-text-muted">
                          [{item.language}]
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDuration(item.duration)}
                        </span>
                        {item.result.result?.exitCode !== undefined && (
                          <span className="text-xs text-text-muted">
                            Exit code: {item.result.result.exitCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-text-secondary hover:text-text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeHistoryItem(item.id)
                      }}
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                      {item.result.error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                          <div className="text-xs text-red-400 font-semibold mb-1">Error</div>
                          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-words">
                            {item.result.error}
                          </pre>
                        </div>
                      )}

                      {item.result.result?.stdout && (
                        <div className="bg-canvas border border-panel-border rounded p-2">
                          <div className="text-xs text-text-muted font-semibold mb-1">stdout</div>
                          <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap break-words">
                            {item.result.result.stdout}
                          </pre>
                        </div>
                      )}

                      {item.result.result?.stderr && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                          <div className="text-xs text-yellow-400 font-semibold mb-1">stderr</div>
                          <pre className="text-xs text-yellow-300 font-mono whitespace-pre-wrap break-words">
                            {item.result.result.stderr}
                          </pre>
                        </div>
                      )}

                      {!item.result.error && !item.result.result?.stdout && !item.result.result?.stderr && (
                        <div className="text-xs text-text-muted italic">No output</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
