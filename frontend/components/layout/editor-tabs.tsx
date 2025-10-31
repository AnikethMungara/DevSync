"use client"

import { X, SplitSquareVertical, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EditorTab } from "@/lib/types"

interface EditorTabsProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onSplitEditor?: () => void
  onSave?: () => void
}

export function EditorTabs({ tabs, activeTabId, onTabSelect, onTabClose, onSplitEditor, onSave }: EditorTabsProps) {
  if (tabs.length === 0) return null

  const activeTab = tabs.find((t) => t.id === activeTabId)
  const hasDirtyTab = activeTab?.isDirty

  return (
    <div className="h-10 bg-panel border-b border-panel-border flex items-center">
      <div className="flex-1 flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`group flex items-center gap-2 px-4 h-full border-r border-panel-border text-sm transition-colors flex-shrink-0 ${
              activeTabId === tab.id
                ? "bg-canvas text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-panel-border/50"
            }`}
          >
            <span className="truncate max-w-[150px]">{tab.name}</span>
            {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" title="Unsaved changes" />}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-panel-border rounded p-0.5 transition-all flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </button>
        ))}
      </div>
      <div className="px-2 border-l border-panel-border flex items-center gap-1">
        {onSave && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 transition-colors ${
              hasDirtyTab
                ? "text-accent-blue hover:text-accent-blue"
                : "text-text-muted hover:text-text-secondary"
            }`}
            onClick={onSave}
            title="Save (Ctrl+S)"
            disabled={!hasDirtyTab}
          >
            <Save className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-text-secondary hover:text-text-primary"
          onClick={onSplitEditor}
          title="Split Editor"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
