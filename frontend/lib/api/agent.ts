import type { AgentMessage, AgentThread } from "@/lib/types"

// Mock agent responses
const mockResponses = [
  "I can help you with that! Let me analyze the code...",
  "Based on the context, here's what I suggest:\n\n```typescript\nfunction example() {\n  return 'Hello World';\n}\n```",
  "I've reviewed the file and found a few potential improvements.",
  "This looks good! The implementation follows best practices.",
]

export async function sendAgentMessage(message: string, context?: Record<string, unknown>): Promise<AgentMessage> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: response,
    createdAt: new Date().toISOString(),
    context,
  }
}

export async function getThreads(): Promise<AgentThread[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  return [
    {
      id: "thread-1",
      title: "Refactor authentication logic",
      scope: "file",
      messages: [
        {
          id: "msg-1",
          role: "user",
          content: "Can you help me refactor this auth code?",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "I'd be happy to help! Let me review the authentication logic...",
          createdAt: new Date(Date.now() - 3500000).toISOString(),
        },
      ],
    },
  ]
}
