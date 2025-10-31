import { create } from "zustand"
import type { EditorTab } from "@/lib/types"
import { updateFile } from "@/lib/api/files"
import { toast } from "sonner"

interface EditorState {
  tabs: EditorTab[]
  activeTabId: string | null
  savingTabs: Set<string>
  autoSaveTimers: Map<string, NodeJS.Timeout>

  addTab: (tab: EditorTab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  getActiveTab: () => EditorTab | null
  saveTab: (id: string) => Promise<void>
  saveActiveTab: () => Promise<void>
  scheduleAutoSave: (id: string) => void
  cancelAutoSave: (id: string) => void
}

const AUTO_SAVE_DELAY = 2000 // 2 seconds

export const useEditors = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  savingTabs: new Set(),
  autoSaveTimers: new Map(),

  addTab: (tab: EditorTab) => {
    const { tabs } = get()
    const existingTab = tabs.find((t) => t.path === tab.path)

    if (existingTab) {
      set({ activeTabId: existingTab.id })
    } else {
      set({ tabs: [...tabs, tab], activeTabId: tab.id })
    }
  },

  removeTab: (id: string) => {
    const { tabs, activeTabId, cancelAutoSave } = get()
    const newTabs = tabs.filter((t) => t.id !== id)
    let newActiveId = activeTabId

    // Cancel any pending auto-save
    cancelAutoSave(id)

    if (activeTabId === id && newTabs.length > 0) {
      const removedIndex = tabs.findIndex((t) => t.id === id)
      newActiveId = newTabs[Math.max(0, removedIndex - 1)]?.id || newTabs[0]?.id
    }

    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateTabContent: (id: string, content: string) => {
    const { scheduleAutoSave } = get()

    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, content, isDirty: true } : tab
      ),
    }))

    // Schedule auto-save
    scheduleAutoSave(id)
  },

  scheduleAutoSave: (id: string) => {
    const { autoSaveTimers, saveTab, cancelAutoSave } = get()

    // Cancel existing timer
    cancelAutoSave(id)

    // Set new timer
    const timer = setTimeout(() => {
      saveTab(id)
    }, AUTO_SAVE_DELAY)

    autoSaveTimers.set(id, timer)
    set({ autoSaveTimers })
  },

  cancelAutoSave: (id: string) => {
    const { autoSaveTimers } = get()
    const timer = autoSaveTimers.get(id)

    if (timer) {
      clearTimeout(timer)
      autoSaveTimers.delete(id)
      set({ autoSaveTimers })
    }
  },

  saveTab: async (id: string) => {
    const { tabs, savingTabs } = get()
    const tab = tabs.find((t) => t.id === id)

    if (!tab || !tab.isDirty || savingTabs.has(id)) {
      return
    }

    // Mark as saving
    savingTabs.add(id)
    set({ savingTabs })

    try {
      await updateFile(tab.path, tab.content)

      // Update tab to mark as saved
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === id ? { ...t, isDirty: false } : t
        ),
      }))

      toast.success(`Saved ${tab.name}`)
    } catch (error) {
      toast.error(`Failed to save ${tab.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error("Save error:", error)
    } finally {
      // Remove from saving set
      savingTabs.delete(id)
      set({ savingTabs })
    }
  },

  saveActiveTab: async () => {
    const { activeTabId, saveTab } = get()
    if (activeTabId) {
      await saveTab(activeTabId)
    }
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId) || null
  },
}))
