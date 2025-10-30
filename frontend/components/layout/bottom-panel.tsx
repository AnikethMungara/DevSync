"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProblemsPanel } from "@/features/problems/problems-panel"
import { ConsolePanel } from "@/features/console/console-panel"
import { useUIStore } from "@/lib/state/ui-store"

interface BottomPanelProps {
  onNavigate: (path: string, line: number) => void
}

export function BottomPanel({ onNavigate }: BottomPanelProps) {
  const {
    activeBottomTab,
    bottomPanelHeight,
    bottomPanelVisible,
    setActiveBottomTab,
    setBottomPanelHeight,
    toggleBottomPanel,
  } = useUIStore()
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return

      const rect = panelRef.current.getBoundingClientRect()
      const newHeight = window.innerHeight - e.clientY
      setBottomPanelHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "row-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, setBottomPanelHeight])

  if (!bottomPanelVisible) return null

  return (
    <div
      ref={panelRef}
      className="bg-panel border-t border-panel-border flex flex-col"
      style={{ height: `${bottomPanelHeight}px` }}
    >
      {/* Resize Handle */}
      <div
        className="h-1 cursor-row-resize hover:bg-accent-blue transition-colors"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="h-2 -mt-1" />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-panel-border">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveBottomTab("problems")}
            className={`text-sm transition-colors ${
              activeBottomTab === "problems" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Problems
          </button>
          <button
            onClick={() => setActiveBottomTab("console")}
            className={`text-sm transition-colors ${
              activeBottomTab === "console" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Console
          </button>
          <button
            onClick={() => setActiveBottomTab("output")}
            className={`text-sm transition-colors ${
              activeBottomTab === "output" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Output
          </button>
          <button
            onClick={() => setActiveBottomTab("git")}
            className={`text-sm transition-colors ${
              activeBottomTab === "git" ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Git
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-text-secondary hover:text-text-primary"
            onClick={toggleBottomPanel}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-text-secondary hover:text-text-primary"
            onClick={toggleBottomPanel}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeBottomTab === "problems" && <ProblemsPanel onNavigate={onNavigate} />}
        {activeBottomTab === "console" && <ConsolePanel />}
        {activeBottomTab === "output" && (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-secondary text-sm">Output panel coming soon...</p>
          </div>
        )}
        {activeBottomTab === "git" && (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-secondary text-sm">Git panel coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
