"use client"

import type React from "react"

import { useState } from "react"
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PromptInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function PromptInput({ onSend, disabled }: PromptInputProps) {
  const [input, setInput] = useState("")

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-panel-border p-3 bg-panel">
      <div className="flex gap-2 mb-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs text-text-secondary hover:text-text-primary">
          <Paperclip className="w-3 h-3 mr-1" />
          Attach context
        </Button>
      </div>
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything... (⌘I)"
          className="min-h-[60px] max-h-[120px] resize-none bg-canvas border-panel-border text-text-primary placeholder:text-text-muted text-sm"
          disabled={disabled}
        />
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          size="icon"
          className="h-[60px] w-12 bg-accent-blue hover:bg-accent-blue-hover text-white flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex gap-2 mt-2 text-xs text-text-muted">
        <span>/explain</span>
        <span>/refactor</span>
        <span>/tests</span>
        <span>/commit</span>
      </div>
    </div>
  )
}
