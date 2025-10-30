"use client"

import { Files, Search, GitBranch, Play, Settings, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityBarProps {
  activeView?: string
  onViewChange?: (view: string) => void
}

export function ActivityBar({ activeView = "explorer", onViewChange }: ActivityBarProps) {
  const activities = [
    { id: "explorer", icon: Files, label: "Explorer", shortcut: "⌘⇧E" },
    { id: "search", icon: Search, label: "Search", shortcut: "⌘⇧F" },
    { id: "source-control", icon: GitBranch, label: "Source Control", shortcut: "⌘⇧G" },
    { id: "run", icon: Play, label: "Run and Debug", shortcut: "⌘⇧D" },
    { id: "devsync", icon: Layers, label: "DevSync", shortcut: "⌘⇧X" },
  ]

  return (
    <div className="w-14 bg-panel border-r border-panel-border flex flex-col items-center py-2 gap-1">
      <TooltipProvider delayDuration={300}>
        {activities.map((activity) => {
          const Icon = activity.icon
          const isActive = activeView === activity.id

          return (
            <Tooltip key={activity.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`w-12 h-12 rounded-md transition-colors ${
                    isActive
                      ? "bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue"
                      : "text-text-secondary hover:text-text-primary hover:bg-panel-border"
                  }`}
                  onClick={() => onViewChange?.(activity.id)}
                >
                  <Icon className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{activity.label}</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">{activity.shortcut}</kbd>
              </TooltipContent>
            </Tooltip>
          )
        })}

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-md text-text-secondary hover:text-text-primary hover:bg-panel-border"
              onClick={() => onViewChange?.("settings")}
            >
              <Settings className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>Settings</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">⌘,</kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
