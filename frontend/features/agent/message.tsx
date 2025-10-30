"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { AgentMessage } from "@/lib/types"

interface MessageProps {
  message: AgentMessage
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderContent = (content: string) => {
    // Simple markdown-like rendering for code blocks
    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```(\w+)?\n?/g, "").replace(/```$/g, "")
        return (
          <div key={i} className="my-3 relative group">
            <pre className="bg-canvas border border-panel-border rounded p-3 text-xs font-mono overflow-x-auto">
              <code className="text-text-primary">{code}</code>
            </pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy(code)}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        )
      }
      return (
        <p key={i} className="whitespace-pre-wrap">
          {part}
        </p>
      )
    })
  }

  return (
    <div className={`mb-4 ${message.role === "user" ? "ml-8" : message.role === "system" ? "mx-4" : "mr-8"}`}>
      <div
        className={`rounded-lg p-3 ${
          message.role === "user"
            ? "bg-accent-blue/10 border border-accent-blue/20"
            : message.role === "system"
              ? "bg-panel border border-panel-border"
              : "bg-panel border border-panel-border"
        }`}
      >
        <div className="flex items-start gap-2 mb-1">
          <span className="text-xs font-semibold text-text-secondary uppercase">
            {message.role === "user" ? "You" : message.role === "system" ? "System" : "AI"}
          </span>
          <span className="text-xs text-text-muted ml-auto">{new Date(message.createdAt).toLocaleTimeString()}</span>
        </div>
        <div className="text-sm text-text-primary leading-relaxed">{renderContent(message.content)}</div>
      </div>
    </div>
  )
}
