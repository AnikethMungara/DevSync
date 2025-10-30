import type { Problem } from "@/lib/types"

const mockProblems: Problem[] = [
  {
    id: "prob-1",
    path: "/src/components/App.tsx",
    line: 12,
    col: 5,
    severity: "error",
    message: "Property 'user' does not exist on type 'AppProps'",
  },
  {
    id: "prob-2",
    path: "/src/lib/utils.ts",
    line: 8,
    col: 15,
    severity: "warn",
    message: "Unused variable 'result'",
  },
  {
    id: "prob-3",
    path: "/src/components/Header.tsx",
    line: 5,
    col: 1,
    severity: "info",
    message: "Consider adding a key prop to this element",
  },
  {
    id: "prob-4",
    path: "/src/lib/api.ts",
    line: 23,
    col: 10,
    severity: "error",
    message: "Cannot find module 'axios'",
  },
]

export async function getProblems(): Promise<Problem[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockProblems
}
