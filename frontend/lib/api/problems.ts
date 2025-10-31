import type { Problem } from "@/lib/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export async function getProblems(): Promise<Problem[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/problems`)
    if (!response.ok) {
      throw new Error(`Failed to fetch problems: ${response.statusText}`)
    }
    const problems = await response.json()
    return problems
  } catch (error) {
    console.error("Error fetching problems:", error)
    // Return empty array on error instead of throwing
    return []
  }
}
