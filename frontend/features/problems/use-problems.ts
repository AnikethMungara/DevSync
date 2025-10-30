import { create } from "zustand"
import type { Problem } from "@/lib/types"

interface ProblemsState {
  problems: Problem[]
  filter: "all" | "error" | "warn" | "info"
  setProblems: (problems: Problem[]) => void
  setFilter: (filter: "all" | "error" | "warn" | "info") => void
  getFilteredProblems: () => Problem[]
}

export const useProblems = create<ProblemsState>((set, get) => ({
  problems: [],
  filter: "all",

  setProblems: (problems) => set({ problems }),

  setFilter: (filter) => set({ filter }),

  getFilteredProblems: () => {
    const { problems, filter } = get()
    if (filter === "all") return problems
    return problems.filter((p) => p.severity === filter)
  },
}))
