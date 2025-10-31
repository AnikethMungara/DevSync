"use client"

import { useEffect, useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Search, Trash2, Edit, FilePlus, FolderPlus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { FsNode } from "@/lib/types"
import { useExplorer } from "@/features/explorer/use-explorer"
import { createFile, deleteFile, renameFile } from "@/lib/api/files"
import { toast } from "sonner"

interface FileTreeNodeProps {
  node: FsNode
  level: number
  onFileSelect: (path: string) => void
  onRefresh: () => void
}

function FileTreeNode({ node, level, onFileSelect, onRefresh }: FileTreeNodeProps) {
  const { selectedNode, toggleFolder, selectNode, isFolderExpanded } = useExplorer()
  const isExpanded = isFolderExpanded(node.id)
  const isSelected = selectedNode === node.id

  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newName, setNewName] = useState("")

  const handleClick = () => {
    selectNode(node.id)
    if (node.type === "folder") {
      toggleFolder(node.id)
    } else {
      onFileSelect(node.path)
    }
  }

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty")
      return
    }

    try {
      const pathParts = node.path.split("/")
      pathParts[pathParts.length - 1] = newName
      const newPath = pathParts.join("/")

      await renameFile(node.path, newPath)
      toast.success(`Renamed to ${newName}`)
      setShowRenameDialog(false)
      setNewName("")
      onRefresh()
    } catch (error) {
      toast.error(`Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteFile(node.path)
      toast.success(`Deleted ${node.name}`)
      setShowDeleteDialog(false)
      onRefresh()
    } catch (error) {
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleNewFile = async () => {
    if (!newName.trim()) {
      toast.error("File name cannot be empty")
      return
    }

    try {
      const newPath = node.type === "folder"
        ? `${node.path}/${newName}`
        : `${node.path.split("/").slice(0, -1).join("/")}/${newName}`

      await createFile(newPath, "", false)
      toast.success(`Created file ${newName}`)
      setShowNewFileDialog(false)
      setNewName("")
      onRefresh()
      // Open the newly created file in the editor
      onFileSelect(newPath)
    } catch (error) {
      toast.error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleNewFolder = async () => {
    if (!newName.trim()) {
      toast.error("Folder name cannot be empty")
      return
    }

    try {
      const newPath = node.type === "folder"
        ? `${node.path}/${newName}`
        : `${node.path.split("/").slice(0, -1).join("/")}/${newName}`

      await createFile(newPath, "", true)
      toast.success(`Created folder ${newName}`)
      setShowNewFolderDialog(false)
      setNewName("")
      onRefresh()
    } catch (error) {
      toast.error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
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
        </ContextMenuTrigger>
        <ContextMenuContent>
          {node.type === "folder" && (
            <>
              <ContextMenuItem onClick={() => { setNewName(""); setShowNewFileDialog(true); }}>
                <FilePlus className="w-4 h-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => { setNewName(""); setShowNewFolderDialog(true); }}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => { setNewName(node.name); setShowRenameDialog(true); }}>
            <Edit className="w-4 h-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} level={level + 1} onFileSelect={onFileSelect} onRefresh={onRefresh} />
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {node.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Enter a new name for {node.name}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New name"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {node.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {node.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New File</DialogTitle>
            <DialogDescription>
              Create a new file in {node.name}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="File name (e.g., index.ts)"
            onKeyDown={(e) => e.key === "Enter" && handleNewFile()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
            <Button onClick={handleNewFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder in {node.name}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => e.key === "Enter" && handleNewFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ProjectExplorerProps {
  onFileSelect: (path: string) => void
}

export function ProjectExplorer({ onFileSelect }: ProjectExplorerProps) {
  const { fileSystem, refreshFileSystem } = useExplorer()
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")

  useEffect(() => {
    refreshFileSystem()
  }, [refreshFileSystem])

  const handleCreateRootFile = async () => {
    console.log("handleCreateRootFile called with:", newFileName)
    if (!newFileName.trim()) {
      toast.error("File name cannot be empty")
      return
    }

    try {
      console.log("Creating file:", newFileName)
      await createFile(newFileName, "", false)
      console.log("File created successfully")
      toast.success(`Created ${newFileName}`)
      setShowNewFileDialog(false)
      const createdPath = newFileName
      setNewFileName("")
      refreshFileSystem()
      // Open the newly created file in the editor
      onFileSelect(createdPath)
    } catch (error) {
      console.error("Error in handleCreateRootFile:", error)
      toast.error(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-panel-border flex items-center justify-between">
        <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Explorer</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-text-secondary hover:text-text-primary"
            onClick={refreshFileSystem}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-text-secondary hover:text-text-primary"
            onClick={() => { setNewFileName(""); setShowNewFileDialog(true); }}
            title="New File"
          >
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
          <FileTreeNode node={fileSystem} level={0} onFileSelect={onFileSelect} onRefresh={refreshFileSystem} />
        ) : (
          <div className="p-4 text-text-muted text-sm">Loading...</div>
        )}
      </div>

      {/* New File Dialog (Root Level) */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New File</DialogTitle>
            <DialogDescription>
              Create a new file in the workspace root
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="File name (e.g., index.ts)"
            onKeyDown={(e) => e.key === "Enter" && handleCreateRootFile()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRootFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
