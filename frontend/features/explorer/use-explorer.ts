import { create } from "zustand"
import type { FsNode } from "@/lib/types"

interface ExplorerState {
  expandedFolders: Set<string>
  selectedNode: string | null
  fileSystem: FsNode | null

  toggleFolder: (id: string) => void
  selectNode: (id: string) => void
  setFileSystem: (fs: FsNode) => void
  isFolderExpanded: (id: string) => boolean
}

export const useExplorer = create<ExplorerState>((set, get) => ({
  expandedFolders: new Set(["root", "src"]),
  selectedNode: null,
  fileSystem: null,

  toggleFolder: (id: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      return { expandedFolders: newExpanded }
    })
  },

  selectNode: (id: string) => set({ selectedNode: id }),

  setFileSystem: (fs: FsNode) => set({ fileSystem: fs }),

  isFolderExpanded: (id: string) => get().expandedFolders.has(id),
}))
