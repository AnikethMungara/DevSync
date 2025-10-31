import { create } from "zustand"
import type { ExecutionResult } from "@/lib/api/execution"

export interface ExecutionHistoryItem {
  id: string
  filePath?: string
  language: string
  timestamp: Date
  result: ExecutionResult
  duration?: number
}

interface ExecutionState {
  // Execution state
  isExecuting: boolean
  currentExecution?: {
    filePath?: string
    language: string
    startTime: number
  }

  // Execution history
  history: ExecutionHistoryItem[]
  maxHistorySize: number

  // Actions
  startExecution: (filePath?: string, language?: string) => void
  finishExecution: (result: ExecutionResult) => void
  clearHistory: () => void
  removeHistoryItem: (id: string) => void
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  isExecuting: false,
  currentExecution: undefined,
  history: [],
  maxHistorySize: 50,

  startExecution: (filePath, language) =>
    set({
      isExecuting: true,
      currentExecution: {
        filePath,
        language: language || "unknown",
        startTime: Date.now(),
      },
    }),

  finishExecution: (result) => {
    const { currentExecution, history, maxHistorySize } = get()
    if (!currentExecution) return

    const duration = Date.now() - currentExecution.startTime
    const historyItem: ExecutionHistoryItem = {
      id: Date.now().toString(),
      filePath: currentExecution.filePath,
      language: currentExecution.language,
      timestamp: new Date(),
      result,
      duration,
    }

    set({
      isExecuting: false,
      currentExecution: undefined,
      history: [historyItem, ...history].slice(0, maxHistorySize),
    })
  },

  clearHistory: () => set({ history: [] }),

  removeHistoryItem: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),
}))
