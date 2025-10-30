import { create } from "zustand"
import type { AgentMessage } from "@/lib/types"

interface AgentState {
  messages: AgentMessage[]
  isStreaming: boolean
  activeMode: "chat" | "explain" | "refactor" | "test" | "commit"
  contextSources: {
    activeFile: boolean
    selection: boolean
    projectSummary: boolean
  }

  addMessage: (message: AgentMessage) => void
  setStreaming: (streaming: boolean) => void
  setActiveMode: (mode: "chat" | "explain" | "refactor" | "test" | "commit") => void
  toggleContextSource: (source: "activeFile" | "selection" | "projectSummary") => void
  clearMessages: () => void
}

export const useAgent = create<AgentState>((set) => ({
  messages: [],
  isStreaming: false,
  activeMode: "chat",
  contextSources: {
    activeFile: true,
    selection: false,
    projectSummary: false,
  },

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setActiveMode: (mode) => set({ activeMode: mode }),

  toggleContextSource: (source) =>
    set((state) => ({
      contextSources: {
        ...state.contextSources,
        [source]: !state.contextSources[source],
      },
    })),

  clearMessages: () => set({ messages: [] }),
}))
