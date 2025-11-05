import type { AgentMessage, AgentThread } from "@/lib/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export async function sendAgentMessage(message: string, context?: Record<string, unknown>): Promise<AgentMessage> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: data.response || data.message || "I received your message.",
      createdAt: new Date().toISOString(),
      context,
    }
  } catch (error) {
    console.error("Error sending agent message:", error)
    throw error
  }
}

export async function getThreads(): Promise<AgentThread[]> {
  try {
    // TODO: Implement threads endpoint in backend
    // For now, return empty array - no hardcoded examples
    return []
  } catch (error) {
    console.error("Error fetching threads:", error)
    return []
  }
}
