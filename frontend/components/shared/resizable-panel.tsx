"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  side: "left" | "right"
  onResize?: (width: number) => void
}

export function ResizablePanel({
  children,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 600,
  side,
  onResize,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return

      const rect = panelRef.current.getBoundingClientRect()
      let newWidth: number

      if (side === "left") {
        newWidth = e.clientX - rect.left
      } else {
        newWidth = rect.right - e.clientX
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setWidth(newWidth)
      onResize?.(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, side, minWidth, maxWidth, onResize])

  return (
    <div ref={panelRef} className="relative flex-shrink-0 bg-panel border-panel-border" style={{ width: `${width}px` }}>
      {children}
      <div
        className={`absolute top-0 ${side === "left" ? "right-0" : "left-0"} w-1 h-full cursor-col-resize hover:bg-accent-blue transition-colors group`}
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute inset-0 -mx-1" />
      </div>
    </div>
  )
}
