// File system types
export interface FsNode {
  id: string
  name: string
  type: "file" | "folder"
  path: string
  children?: FsNode[]
}

export interface FileContent {
  path: string
  content: string
  language: string
  updatedAt: string
}

// Problems types
export interface Problem {
  id: string
  path: string
  line: number
  col: number
  severity: "error" | "warn" | "info"
  message: string
}

// Agent types
export interface AgentMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
  context?: Record<string, unknown>
}

export interface AgentThread {
  id: string
  title: string
  messages: AgentMessage[]
  scope: "file" | "workspace" | "selection"
}

// Editor types
export interface EditorTab {
  id: string
  path: string
  name: string
  isDirty: boolean
  content: string
  language: string
}
