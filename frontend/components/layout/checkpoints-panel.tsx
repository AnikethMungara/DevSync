"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Save, RotateCcw, Trash2, Clock, FileText, HardDrive, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  createCheckpoint,
  listCheckpoints,
  revertToCheckpoint,
  deleteCheckpoint,
  formatFileSize,
  formatRelativeTime,
  type Checkpoint,
} from "@/lib/api/checkpoints"

export function CheckpointsPanel() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [maxCheckpoints, setMaxCheckpoints] = useState(3)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [checkpointName, setCheckpointName] = useState("")
  const [checkpointDescription, setCheckpointDescription] = useState("")
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null)

  // Load checkpoints
  const loadCheckpoints = async () => {
    try {
      setLoading(true)
      const response = await listCheckpoints()
      setCheckpoints(response.checkpoints)
      setMaxCheckpoints(response.max_checkpoints)
    } catch (error) {
      console.error("Failed to load checkpoints:", error)
      toast.error("Failed to load checkpoints")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCheckpoints()
  }, [])

  // Create checkpoint
  const handleCreateCheckpoint = async () => {
    if (!checkpointName.trim()) {
      toast.error("Please enter a checkpoint name")
      return
    }

    try {
      setCreating(true)
      const checkpoint = await createCheckpoint({
        name: checkpointName,
        description: checkpointDescription,
      })

      toast.success(`Checkpoint "${checkpoint.name}" created successfully`)
      setShowCreateDialog(false)
      setCheckpointName("")
      setCheckpointDescription("")
      await loadCheckpoints()
    } catch (error: any) {
      console.error("Failed to create checkpoint:", error)
      toast.error(error.message || "Failed to create checkpoint")
    } finally {
      setCreating(false)
    }
  }

  // Revert to checkpoint
  const handleRevertCheckpoint = async () => {
    if (!selectedCheckpoint) return

    try {
      const response = await revertToCheckpoint(selectedCheckpoint.id)
      toast.success(
        `Reverted to "${selectedCheckpoint.name}" - ${response.files_restored} files restored`
      )
      setRevertDialogOpen(false)
      setSelectedCheckpoint(null)

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error("Failed to revert checkpoint:", error)
      toast.error(error.message || "Failed to revert to checkpoint")
    }
  }

  // Delete checkpoint
  const handleDeleteCheckpoint = async (checkpoint: Checkpoint) => {
    if (!confirm(`Are you sure you want to delete checkpoint "${checkpoint.name}"?`)) {
      return
    }

    try {
      await deleteCheckpoint(checkpoint.id)
      toast.success(`Checkpoint "${checkpoint.name}" deleted`)
      await loadCheckpoints()
    } catch (error: any) {
      console.error("Failed to delete checkpoint:", error)
      toast.error(error.message || "Failed to delete checkpoint")
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Checkpoints</h2>
          <span className="text-xs text-gray-400">
            ({checkpoints.length}/{maxCheckpoints})
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Create Checkpoint
        </Button>
      </div>

      {/* Checkpoints List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Loading checkpoints...</p>
          </div>
        ) : checkpoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <Clock className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm mb-2">No checkpoints yet</p>
            <p className="text-xs text-gray-500">
              Create a checkpoint to save a snapshot of your project
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                className="bg-[#252526] border border-[#3e3e42] rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                {/* Checkpoint Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {checkpoint.name}
                    </h3>
                    {checkpoint.description && (
                      <p className="text-xs text-gray-400 mb-2">
                        {checkpoint.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Checkpoint Info */}
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(checkpoint.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{checkpoint.file_count} files</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    <span>{formatFileSize(checkpoint.size_bytes)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCheckpoint(checkpoint)
                      setRevertDialogOpen(true)
                    }}
                    className="flex-1 bg-green-600/10 border-green-600/50 hover:bg-green-600/20 text-green-400"
                  >
                    <RotateCcw className="h-3 w-3 mr-2" />
                    Revert
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCheckpoint(checkpoint)}
                    className="bg-red-600/10 border-red-600/50 hover:bg-red-600/20 text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Info Footer */}
      <div className="border-t border-[#3e3e42] p-3 bg-[#252526]">
        <p className="text-xs text-gray-400 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          Only the last {maxCheckpoints} checkpoints are kept. Older ones are auto-deleted.
        </p>
      </div>

      {/* Create Checkpoint Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1e1e1e] border-[#3e3e42] text-white">
          <DialogHeader>
            <DialogTitle>Create Checkpoint</DialogTitle>
            <DialogDescription className="text-gray-400">
              Save a snapshot of your current project state
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Checkpoint Name *
              </label>
              <Input
                placeholder="e.g., Before refactoring"
                value={checkpointName}
                onChange={(e) => setCheckpointName(e.target.value)}
                className="bg-[#252526] border-[#3e3e42] text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCreateCheckpoint()
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (optional)
              </label>
              <Input
                placeholder="e.g., Working version before major changes"
                value={checkpointDescription}
                onChange={(e) => setCheckpointDescription(e.target.value)}
                className="bg-[#252526] border-[#3e3e42] text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="bg-[#252526] border-[#3e3e42] text-white hover:bg-[#353537]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCheckpoint}
              disabled={creating || !checkpointName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent className="bg-[#1e1e1e] border-[#3e3e42] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Confirm Revert
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will replace all files in your workspace with the checkpoint version.
            </DialogDescription>
          </DialogHeader>

          {selectedCheckpoint && (
            <div className="py-4">
              <div className="bg-[#252526] border border-[#3e3e42] rounded p-4 space-y-2">
                <p className="text-sm">
                  <span className="text-gray-400">Checkpoint:</span>{" "}
                  <span className="text-white font-semibold">{selectedCheckpoint.name}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Created:</span>{" "}
                  <span className="text-white">
                    {formatRelativeTime(selectedCheckpoint.created_at)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Files:</span>{" "}
                  <span className="text-white">{selectedCheckpoint.file_count}</span>
                </p>
              </div>

              <p className="text-sm text-yellow-400 mt-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Warning: Any unsaved changes will be lost. The page will reload after
                  reverting.
                </span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevertDialogOpen(false)
                setSelectedCheckpoint(null)
              }}
              className="bg-[#252526] border-[#3e3e42] text-white hover:bg-[#353537]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevertCheckpoint}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Revert to Checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
