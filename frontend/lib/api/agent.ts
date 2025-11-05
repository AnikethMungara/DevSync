import type { AgentMessage, AgentThread } from "@/lib/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export interface CreateSessionOptions {
  model?: string
  allow_tools?: string[]
  temperature?: number
}

export interface SendMessageOptions {
  stream?: boolean
}

export interface ToolCall {
  name: string
  args: Record<string, any>
  result?: any
}

export interface AgentResponse {
  content: string
  tool_calls?: ToolCall[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Create a new agent session
export async function createAgentSession(options?: CreateSessionOptions): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options || {}),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to create session" }))
      throw new Error(error.detail || `Failed to create session: ${response.statusText}`)
    }

    const data = await response.json()
    return data.session_id
  } catch (error) {
    console.error("Error creating agent session:", error)
    throw error
  }
}

// Send message to agent (non-streaming)
export async function sendAgentMessage(
  sessionId: string,
  message: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/sessions/${sessionId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to send message" }))
      throw new Error(error.detail || `Failed to send message: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.response?.content || "",
      tool_calls: data.response?.tool_calls,
      usage: data.response?.usage,
    }
  } catch (error) {
    console.error("Error sending agent message:", error)
    throw error
  }
}

// Connect to WebSocket for streaming
export function connectAgentStream(sessionId: string): WebSocket {
  const wsUrl = BACKEND_URL.replace("http://", "ws://").replace("https://", "wss://")
  const ws = new WebSocket(`${wsUrl}/api/agent/sessions/${sessionId}/stream`)

  return ws
}

// Cancel agent session
export async function cancelAgentSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/sessions/${sessionId}/cancel`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel session: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error cancelling agent session:", error)
    throw error
  }
}

// Delete agent session
export async function deleteAgentSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/agent/sessions/${sessionId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error deleting agent session:", error)
    throw error
  }
}

export async function getThreads(): Promise<AgentThread[]> {
  try {
    // TODO: Implement threads endpoint in backend
    // For now, return empty array
    return []
  } catch (error) {
    console.error("Error fetching threads:", error)
    return []
  }
}
