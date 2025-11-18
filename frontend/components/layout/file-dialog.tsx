"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, File, ChevronRight, ChevronDown, ArrowUp } from "lucide-react"
import { useUIStore } from "@/lib/state/ui-store"

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileItem[]
}

interface FileDialogProps {
  onFileSelect?: (path: string) => void
  onNewFile?: (path: string, name: string) => void
  onSaveFile?: (path: string) => void
}

export function FileDialog({ onFileSelect, onNewFile, onSaveFile }: FileDialogProps) {
  const { fileDialogOpen, fileDialogMode, setFileDialogOpen } = useUIStore()
  const [currentPath, setCurrentPath] = useState("")
  const [fileName, setFileName] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Fetch files when dialog opens or path changes
  useEffect(() => {
    if (fileDialogOpen) {
      fetchFiles(currentPath)
    }
  }, [fileDialogOpen, currentPath])

  const fetchFiles = async (path: string) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8787/api/files/list?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error("Failed to fetch files:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
      toggleFolder(file.path)
    } else {
      setSelectedFile(file.path)
      if (fileDialogMode === "save") {
        setFileName(file.name)
      }
    }
  }

  const handleFileDoubleClick = (file: FileItem) => {
    if (file.isDirectory) {
      setCurrentPath(file.path)
    } else if (fileDialogMode === "open") {
      handleConfirm()
    }
  }

  const handleConfirm = () => {
    switch (fileDialogMode) {
      case "open":
        if (selectedFile && onFileSelect) {
          onFileSelect(selectedFile)
        }
        break
      case "new":
        if (fileName && onNewFile) {
          const path = currentPath ? `${currentPath}/${fileName}` : fileName
          onNewFile(currentPath, fileName)
        }
        break
      case "save":
        if (fileName && onSaveFile) {
          const path = currentPath ? `${currentPath}/${fileName}` : fileName
          onSaveFile(path)
        }
        break
    }
    setFileDialogOpen(false)
    resetState()
  }

  const resetState = () => {
    setSelectedFile(null)
    setFileName("")
  }

  const goUp = () => {
    const parts = currentPath.split("/").filter(Boolean)
    parts.pop()
    setCurrentPath(parts.join("/"))
  }

  const getDialogTitle = () => {
    switch (fileDialogMode) {
      case "open":
        return "Open File"
      case "new":
        return "New File"
      case "save":
        return "Save As"
      default:
        return "File Dialog"
    }
  }

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path)
      const isSelected = selectedFile === item.path

      return (
        <div key={item.path}>
          <div
            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm ${
              isSelected ? "bg-accent" : ""
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => handleFileClick(item)}
            onDoubleClick={() => handleFileDoubleClick(item)}
          >
            {item.isDirectory ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
              </>
            ) : (
              <>
                <span className="w-4" />
                <File className="h-4 w-4 text-blue-500 shrink-0" />
              </>
            )}
            <span className="text-sm truncate">{item.name}</span>
          </div>
          {item.isDirectory && isExpanded && item.children && (
            <div>{renderFileTree(item.children, depth + 1)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Path */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goUp}
              disabled={!currentPath}
              className="h-8 w-8"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Input
              value={currentPath || "/"}
              onChange={(e) => setCurrentPath(e.target.value)}
              className="flex-1"
              placeholder="/"
            />
          </div>

          {/* File List */}
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No files found</p>
                </div>
              ) : (
                renderFileTree(files)
              )}
            </div>
          </ScrollArea>

          {/* File Name Input (for new/save) */}
          {(fileDialogMode === "new" || fileDialogMode === "save") && (
            <div className="space-y-2">
              <Label htmlFor="fileName">File name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name..."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setFileDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              (fileDialogMode === "open" && !selectedFile) ||
              ((fileDialogMode === "new" || fileDialogMode === "save") && !fileName)
            }
          >
            {fileDialogMode === "open" ? "Open" : fileDialogMode === "new" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
