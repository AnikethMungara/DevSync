"use client"

import type { EditorTab } from "@/lib/types"

interface EditorPaneProps {
  tab: EditorTab | null
  onContentChange?: (content: string) => void
}

export function EditorPane({ tab, onContentChange }: EditorPaneProps) {
  if (!tab) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas">
        <div className="text-center">
          <p className="text-text-secondary text-lg mb-2">No file open</p>
          <p className="text-text-muted text-sm">Open a file from the explorer or create a new one</p>
          <div className="mt-6 flex gap-2 justify-center text-xs text-text-muted">
            <kbd className="px-2 py-1 bg-panel border border-panel-border rounded">⌘N</kbd>
            <span>New File</span>
            <span className="mx-2">•</span>
            <kbd className="px-2 py-1 bg-panel border border-panel-border rounded">⌘O</kbd>
            <span>Open File</span>
          </div>
        </div>
      </div>
    )
  }

  // Syntax highlighting helper
  const highlightSyntax = (code: string, language: string) => {
    if (language !== "typescript") return code

    return code
      .split("\n")
      .map((line, i) => {
        let highlighted = line
        // Keywords
        highlighted = highlighted.replace(
          /\b(import|export|from|function|const|let|var|return|if|else|class|interface|type|async|await)\b/g,
          '<span style="color: var(--token-keyword)">$1</span>',
        )
        // Strings
        highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span style="color: var(--token-string)">$1$2$1</span>')
        // Comments
        highlighted = highlighted.replace(/(\/\/.*$)/g, '<span style="color: var(--token-comment)">$1</span>')
        // Functions
        highlighted = highlighted.replace(
          /\b([a-zA-Z_]\w*)\s*\(/g,
          '<span style="color: var(--token-function)">$1</span>(',
        )

        return `<div class="leading-6"><span class="inline-block w-12 text-right pr-4 select-none" style="color: var(--text-muted)">${i + 1}</span><span>${highlighted}</span></div>`
      })
      .join("")
  }

  return (
    <div className="h-full bg-canvas overflow-auto">
      <div
        className="p-4 text-sm font-mono text-text-primary"
        dangerouslySetInnerHTML={{ __html: highlightSyntax(tab.content, tab.language) }}
      />
    </div>
  )
}
