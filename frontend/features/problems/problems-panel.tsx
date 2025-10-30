"use client"

import { useEffect } from "react"
import { AlertCircle, AlertTriangle, Info, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Problem } from "@/lib/types"
import { useProblems } from "./use-problems"
import { getProblems } from "@/lib/api/problems"

interface ProblemItemProps {
  problem: Problem
  onNavigate: (path: string, line: number) => void
}

function ProblemItem({ problem, onNavigate }: ProblemItemProps) {
  const Icon = problem.severity === "error" ? AlertCircle : problem.severity === "warn" ? AlertTriangle : Info

  const iconColor =
    problem.severity === "error" ? "text-error" : problem.severity === "warn" ? "text-warning" : "text-accent-blue"

  return (
    <button
      onClick={() => onNavigate(problem.path, problem.line)}
      className="w-full flex items-start gap-3 px-4 py-2 hover:bg-panel-border transition-colors text-left group"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary mb-1">{problem.message}</p>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="truncate">{problem.path}</span>
          <span>•</span>
          <span>
            Ln {problem.line}, Col {problem.col}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(problem.message)
        }}
      >
        <Copy className="w-3 h-3" />
      </Button>
    </button>
  )
}

interface ProblemsPanelProps {
  onNavigate: (path: string, line: number) => void
}

export function ProblemsPanel({ onNavigate }: ProblemsPanelProps) {
  const { problems, filter, setProblems, setFilter, getFilteredProblems } = useProblems()

  useEffect(() => {
    getProblems().then(setProblems)
  }, [setProblems])

  const filteredProblems = getFilteredProblems()
  const errorCount = problems.filter((p) => p.severity === "error").length
  const warnCount = problems.filter((p) => p.severity === "warn").length
  const infoCount = problems.filter((p) => p.severity === "info").length

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-panel-border">
        <button
          onClick={() => setFilter("all")}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            filter === "all"
              ? "bg-accent-blue/20 text-accent-blue"
              : "text-text-secondary hover:text-text-primary hover:bg-panel-border"
          }`}
        >
          All ({problems.length})
        </button>
        <button
          onClick={() => setFilter("error")}
          className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
            filter === "error"
              ? "bg-error/20 text-error"
              : "text-text-secondary hover:text-text-primary hover:bg-panel-border"
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          Errors ({errorCount})
        </button>
        <button
          onClick={() => setFilter("warn")}
          className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
            filter === "warn"
              ? "bg-warning/20 text-warning"
              : "text-text-secondary hover:text-text-primary hover:bg-panel-border"
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          Warnings ({warnCount})
        </button>
        <button
          onClick={() => setFilter("info")}
          className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
            filter === "info"
              ? "bg-accent-blue/20 text-accent-blue"
              : "text-text-secondary hover:text-text-primary hover:bg-panel-border"
          }`}
        >
          <Info className="w-3 h-3" />
          Info ({infoCount})
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredProblems.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-secondary text-sm">No problems detected</p>
          </div>
        ) : (
          <div>
            {filteredProblems.map((problem) => (
              <ProblemItem key={problem.id} problem={problem} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
