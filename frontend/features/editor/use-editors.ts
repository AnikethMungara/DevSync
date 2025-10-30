import { create } from "zustand"
import type { EditorTab } from "@/lib/types"

interface EditorState {
  tabs: EditorTab[]
  activeTabId: string | null

  addTab: (tab: EditorTab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  getActiveTab: () => EditorTab | null
}

export const useEditors = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,

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
    const { tabs, activeTabId } = get()
    const newTabs = tabs.filter((t) => t.id !== id)
    let newActiveId = activeTabId

    if (activeTabId === id && newTabs.length > 0) {
      const removedIndex = tabs.findIndex((t) => t.id === id)
      newActiveId = newTabs[Math.max(0, removedIndex - 1)]?.id || newTabs[0]?.id
    }

    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateTabContent: (id: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, content, isDirty: true } : tab)),
    }))
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId) || null
  },
}))
