/**
 * Keyboard shortcuts management hook
 * Provides centralized keyboard event handling with platform-specific support
 */

import { useEffect, useCallback, useRef } from "react"
import { useSettingsStore } from "@/lib/state/settings-store"

export type ShortcutAction =
  | "saveFile"
  | "openFile"
  | "closeFile"
  | "newFile"
  | "commandPalette"
  | "toggleTerminal"
  | "toggleSidebar"
  | "findInFiles"
  | "quickOpen"
  | "formatDocument"
  | "runFile"
  | "toggleBottomPanel"
  | "nextTab"
  | "previousTab"
  | "closeTab"
  | "duplicateLine"
  | "deleteLine"
  | "moveLineUp"
  | "moveLineDown"
  | "toggleComment"

export interface ShortcutHandler {
  action: ShortcutAction
  handler: () => void
  description?: string
}

export interface KeyboardShortcutOptions {
  /**
   * Whether to prevent default browser behavior
   * @default true
   */
  preventDefault?: boolean
  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean
  /**
   * Whether to enable shortcuts when focused on input elements
   * @default false
   */
  enableInInputs?: boolean
}

/**
 * Parses a keyboard shortcut string into components
 * @param shortcut - Shortcut string (e.g., "Ctrl+Shift+P")
 * @returns Object with modifier keys and main key
 */
export function parseShortcut(shortcut: string): {
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  key: string
} {
  const parts = shortcut.split("+").map(p => p.trim())

  return {
    ctrl: parts.some(p => p.toLowerCase() === "ctrl"),
    shift: parts.some(p => p.toLowerCase() === "shift"),
    alt: parts.some(p => p.toLowerCase() === "alt"),
    meta: parts.some(p => p.toLowerCase() === "meta" || p.toLowerCase() === "cmd"),
    key: parts[parts.length - 1].toLowerCase()
  }
}

/**
 * Checks if a keyboard event matches a shortcut
 * @param event - Keyboard event
 * @param shortcut - Shortcut string to match against
 * @returns Whether the event matches the shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut)
  const eventKey = event.key.toLowerCase()

  // Handle special keys
  let keyMatch = false
  if (parsed.key === "`" && eventKey === "`") {
    keyMatch = true
  } else if (eventKey === parsed.key) {
    keyMatch = true
  }

  // Check modifiers
  const ctrlMatch = parsed.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey
  const shiftMatch = parsed.shift ? event.shiftKey : !event.shiftKey
  const altMatch = parsed.alt ? event.altKey : !event.altKey

  // For Ctrl shortcuts, accept either Ctrl or Meta (Cmd on Mac)
  const modifierMatch = parsed.ctrl
    ? (event.ctrlKey || event.metaKey) && shiftMatch && altMatch
    : ctrlMatch && shiftMatch && altMatch

  return keyMatch && modifierMatch
}

/**
 * Formats a shortcut string for display
 * @param shortcut - Shortcut string
 * @returns Formatted string with platform-specific symbols
 */
export function formatShortcutForDisplay(shortcut: string): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0

  let formatted = shortcut
    .replace(/Ctrl/g, isMac ? "⌃" : "Ctrl")
    .replace(/Shift/g, isMac ? "⇧" : "Shift")
    .replace(/Alt/g, isMac ? "⌥" : "Alt")
    .replace(/Meta/g, "⌘")
    .replace(/Cmd/g, "⌘")

  // Replace Ctrl with Cmd symbol on Mac
  if (isMac && formatted.includes(isMac ? "⌃" : "Ctrl")) {
    formatted = formatted.replace(isMac ? "⌃" : "Ctrl", "⌘")
  }

  return formatted
}

/**
 * Validates if a shortcut string is properly formatted
 * @param shortcut - Shortcut string to validate
 * @returns Whether the shortcut is valid
 */
export function isValidShortcut(shortcut: string): boolean {
  if (!shortcut || typeof shortcut !== "string") return false

  const parts = shortcut.split("+").map(p => p.trim())
  if (parts.length === 0) return false

  // Check if all parts are valid
  const validModifiers = ["ctrl", "shift", "alt", "meta", "cmd"]
  const modifiers = parts.slice(0, -1).map(p => p.toLowerCase())

  return modifiers.every(m => validModifiers.includes(m)) && parts[parts.length - 1].length > 0
}

/**
 * Detects conflicts between shortcuts
 * @param shortcuts - Object of all current shortcuts
 * @returns Array of conflicting shortcut pairs
 */
export function detectShortcutConflicts(shortcuts: Record<string, string>): Array<[string, string]> {
  const conflicts: Array<[string, string]> = []
  const entries = Object.entries(shortcuts)

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i][1] === entries[j][1]) {
        conflicts.push([entries[i][0], entries[j][0]])
      }
    }
  }

  return conflicts
}

/**
 * Custom hook for managing keyboard shortcuts
 * @param handlers - Array of shortcut handlers
 * @param options - Configuration options
 */
export function useKeyboardShortcuts(
  handlers: ShortcutHandler[],
  options: KeyboardShortcutOptions = {}
) {
  const { keyboardShortcuts } = useSettingsStore()
  const handlersRef = useRef(handlers)

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const {
        preventDefault = true,
        stopPropagation = false,
        enableInInputs = false,
      } = options

      // Check if we're in an input element
      const target = event.target as HTMLElement
      const isInInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      if (isInInput && !enableInInputs) {
        // Allow some shortcuts in inputs (like Ctrl+S)
        const allowedInInputs = ["saveFile", "commandPalette", "quickOpen"]
        const matchedHandler = handlersRef.current.find(({ action }) => {
          const shortcut = keyboardShortcuts[action]
          return shortcut && matchesShortcut(event, shortcut) && allowedInInputs.includes(action)
        })

        if (matchedHandler) {
          if (preventDefault) event.preventDefault()
          if (stopPropagation) event.stopPropagation()
          matchedHandler.handler()
        }
        return
      }

      // Find matching handler
      const matchedHandler = handlersRef.current.find(({ action }) => {
        const shortcut = keyboardShortcuts[action]
        return shortcut && matchesShortcut(event, shortcut)
      })

      if (matchedHandler) {
        if (preventDefault) event.preventDefault()
        if (stopPropagation) event.stopPropagation()
        matchedHandler.handler()
      }
    },
    [keyboardShortcuts, options]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook to get the current shortcut for an action
 * @param action - The shortcut action
 * @returns The current shortcut string
 */
export function useShortcut(action: ShortcutAction): string {
  const { keyboardShortcuts } = useSettingsStore()
  return keyboardShortcuts[action]
}

/**
 * Hook to get formatted display of a shortcut
 * @param action - The shortcut action
 * @returns Formatted shortcut string for display
 */
export function useShortcutDisplay(action: ShortcutAction): string {
  const shortcut = useShortcut(action)
  return formatShortcutForDisplay(shortcut)
}
