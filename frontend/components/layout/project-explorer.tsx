"use client"

import { useEffect } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FsNode } from "@/lib/types"
import { useExplorer } from "@/features/explorer/use-explorer"
import { getFileSystem } from "@/lib/api/files"

interface FileTreeNodeProps {
  node: FsNode
  level: number
  onFileSelect: (path: string) => void
}

function FileTreeNode({ node, level, onFileSelect }: FileTreeNodeProps) {
  const { expandedFolders, selectedNode, toggleFolder, selectNode, isFolderExpanded } = useExplorer()
  const isExpanded = isFolderExpanded(node.id)
  const isSelected = selectedNode === node.id

  const handleClick = () => {
    selectNode(node.id)
    if (node.type === "folder") {
      toggleFolder(node.id)
    } else {
      onFileSelect(node.path)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm hover:bg-panel-border transition-colors ${
          isSelected ? "bg-selection text-text-primary" : "text-text-secondary"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.type === "folder" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0 text-accent-blue" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0 text-accent-blue" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <File className="w-4 h-4 flex-shrink-0 text-text-muted" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} level={level + 1} onFileSelect={onFileSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ProjectExplorerProps {
  onFileSelect: (path: string) => void
}

export function ProjectExplorer({ onFileSelect }: ProjectExplorerProps) {
  const { fileSystem, setFileSystem } = useExplorer()

  useEffect(() => {
    getFileSystem().then(setFileSystem)
  }, [setFileSystem])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-panel-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Explorer</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-text-secondary hover:text-text-primary">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-panel-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <Input
            placeholder="Search files..."
            className="h-7 pl-7 text-xs bg-canvas border-panel-border text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto py-1">
        {fileSystem ? (
          <FileTreeNode node={fileSystem} level={0} onFileSelect={onFileSelect} />
        ) : (
          <div className="p-4 text-text-muted text-sm">Loading...</div>
        )}
      </div>
    </div>
  )
}
