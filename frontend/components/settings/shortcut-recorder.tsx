/**
 * Keyboard shortcut recorder component
 * Allows users to record custom keyboard shortcuts
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check, AlertTriangle } from "lucide-react"

interface ShortcutRecorderProps {
  value: string
  onValueChange: (value: string) => void
  onCancel?: () => void
  conflictsWith?: string[]
  disabled?: boolean
}

export function ShortcutRecorder({
  value,
  onValueChange,
  onCancel,
  conflictsWith = [],
  disabled = false,
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []

      // Add modifiers
      if (e.ctrlKey || e.metaKey) {
        keys.push("Ctrl")
      }
      if (e.shiftKey) {
        keys.push("Shift")
      }
      if (e.altKey) {
        keys.push("Alt")
      }

      // Add main key (ignore modifier keys themselves)
      const key = e.key
      if (
        key !== "Control" &&
        key !== "Shift" &&
        key !== "Alt" &&
        key !== "Meta"
      ) {
        // Special key formatting
        let formattedKey = key
        if (key === " ") formattedKey = "Space"
        else if (key.length === 1) formattedKey = key.toUpperCase()

        keys.push(formattedKey)

        // Only commit if we have a main key
        const shortcut = keys.join("+")
        setRecordedKeys(keys)
        onValueChange(shortcut)

        // Auto-stop recording after a short delay
        setTimeout(() => {
          setIsRecording(false)
        }, 300)
      } else {
        setRecordedKeys(keys)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener("keydown", handleKeyDown, true)
    window.addEventListener("keyup", handleKeyUp, true)

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
      window.removeEventListener("keyup", handleKeyUp, true)
    }
  }, [isRecording, onValueChange])

  const handleStartRecording = () => {
    setIsRecording(true)
    setRecordedKeys([])
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setRecordedKeys([])
  }

  const handleClear = () => {
    onValueChange("")
    setRecordedKeys([])
  }

  const displayValue = isRecording
    ? recordedKeys.length > 0
      ? recordedKeys.join("+")
      : "Press keys..."
    : value || "Not set"

  const hasConflict = conflictsWith.length > 0

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          value={displayValue}
          readOnly
          onClick={handleStartRecording}
          disabled={disabled}
          className={`cursor-pointer font-mono text-sm ${
            isRecording ? "ring-2 ring-blue-500" : ""
          } ${hasConflict ? "border-yellow-500" : ""}`}
          placeholder="Click to record..."
        />
        {hasConflict && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </div>

      {isRecording ? (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStopRecording}
            className="h-8 w-8 p-0"
            title="Stop recording"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              handleStopRecording()
              onCancel?.()
            }}
            className="h-8 w-8 p-0"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Clear shortcut"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
