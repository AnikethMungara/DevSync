"use client"

import { useState, useEffect } from "react"
import { ActivityBar } from "@/components/layout/activity-bar"
import { ProjectExplorer } from "@/components/layout/project-explorer"
import { EditorTabs } from "@/components/layout/editor-tabs"
import { EditorPane } from "@/components/layout/editor-pane"
import { Topbar } from "@/components/layout/topbar"
import { AgentSidebar } from "@/components/layout/agent-sidebar"
import { GitSidebar } from "@/components/layout/git-sidebar"
import { SearchSidebar } from "@/components/layout/search-sidebar"
import { SettingsPanel } from "@/components/layout/settings-panel"
import { BottomPanel } from "@/components/layout/bottom-panel"
import { CommandPalette } from "@/components/layout/command-palette"
import { ResizablePanel } from "@/components/shared/resizable-panel"
import { useUIStore } from "@/lib/state/ui-store"
import { useEditors } from "@/features/editor/use-editors"
import { getFileContent } from "@/lib/api/files"
import { useCodeExecution } from "@/hooks/use-code-execution"

export default function WorkspacePage() {
  const [activeView, setActiveView] = useState("explorer")
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const {
    explorerVisible,
    agentSidebarVisible,
    explorerWidth,
    agentSidebarWidth,
    setExplorerWidth,
    setAgentSidebarWidth,
  } = useUIStore()

  const { tabs, activeTabId, addTab, removeTab, setActiveTab, updateTabContent, saveActiveTab } = useEditors()
  const { runActiveFile, isExecuting } = useCodeExecution()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        saveActiveTab()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        if (!isExecuting) {
          runActiveFile()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [saveActiveTab, runActiveFile, isExecuting])

  const handleFileSelect = async (path: string) => {
    const content = await getFileContent(path)
    const fileName = path.split("/").pop() || path

    addTab({
      id: `tab-${Date.now()}`,
      path,
      name: fileName,
      isDirty: false,
      content: content.content,
      language: content.language,
    })
  }

  const handleNavigateToFile = async (path: string, line: number) => {
    // Open file if not already open
    const existingTab = tabs.find((t) => t.path === path)
    if (!existingTab) {
      await handleFileSelect(path)
    } else {
      setActiveTab(existingTab.id)
    }
    // In a real implementation, would scroll to the line
    console.log(`Navigate to ${path}:${line}`)
  }

  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Activity Bar */}
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />

      {/* Left Panel - File Explorer, Git, Search, or Settings */}
      {explorerVisible && (
        <ResizablePanel side="left" defaultWidth={explorerWidth} onResize={setExplorerWidth}>
          {activeView === "source-control" ? (
            <GitSidebar />
          ) : activeView === "search" ? (
            <SearchSidebar />
          ) : activeView === "settings" ? (
            <SettingsPanel />
          ) : (
            <ProjectExplorer onFileSelect={handleFileSelect} />
          )}
        </ResizablePanel>
      )}

      {/* Center - Editor Region */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <Topbar
          onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
          onRun={runActiveFile}
          isRunning={isExecuting}
        />

        {/* Editor Tabs */}
        <EditorTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTab}
          onTabClose={removeTab}
          onSplitEditor={() => console.log("Split editor")}
          onSave={saveActiveTab}
        />

        {/* Editor Area */}
        <div className="flex-1 min-h-0">
          <EditorPane
            tab={activeTab || null}
            onContentChange={(content) => {
              if (activeTabId) {
                updateTabContent(activeTabId, content)
              }
            }}
          />
        </div>

        {/* Bottom Panel */}
        <BottomPanel onNavigate={handleNavigateToFile} />
      </div>

      {/* Right Panel - AI Agent Sidebar */}
      {agentSidebarVisible && (
        <ResizablePanel side="right" defaultWidth={agentSidebarWidth} onResize={setAgentSidebarWidth}>
          <AgentSidebar />
        </ResizablePanel>
      )}

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onFileSelect={handleFileSelect} />
    </div>
  )
}
