import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  // Panel visibility
  explorerVisible: boolean
  agentSidebarVisible: boolean
  bottomPanelVisible: boolean

  // Panel sizes (in pixels)
  explorerWidth: number
  agentSidebarWidth: number
  bottomPanelHeight: number

  // Active panels
  activeBottomTab: "problems" | "console" | "output" | "git"

  // Actions
  toggleExplorer: () => void
  toggleAgentSidebar: () => void
  toggleBottomPanel: () => void
  setExplorerWidth: (width: number) => void
  setAgentSidebarWidth: (width: number) => void
  setBottomPanelHeight: (height: number) => void
  setActiveBottomTab: (tab: "problems" | "console" | "output" | "git") => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      explorerVisible: true,
      agentSidebarVisible: true,
      bottomPanelVisible: true,
      explorerWidth: 280,
      agentSidebarWidth: 400,
      bottomPanelHeight: 200,
      activeBottomTab: "problems",

      toggleExplorer: () => set((state) => ({ explorerVisible: !state.explorerVisible })),
      toggleAgentSidebar: () => set((state) => ({ agentSidebarVisible: !state.agentSidebarVisible })),
      toggleBottomPanel: () => set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible })),
      setExplorerWidth: (width) => set({ explorerWidth: Math.max(200, Math.min(600, width)) }),
      setAgentSidebarWidth: (width) => set({ agentSidebarWidth: Math.max(300, Math.min(800, width)) }),
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: Math.max(100, Math.min(600, height)) }),
      setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
    }),
    {
      name: "devsync-ui-state",
    },
  ),
)
