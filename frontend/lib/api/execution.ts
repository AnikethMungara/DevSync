const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export interface ExecutionResult {
  success: boolean
  result?: {
    exitCode: number
    stdout: string
    stderr: string
    success: boolean
    executionTime: number
  }
  error?: string
}

export interface ExecutionRequest {
  filePath?: string
  code?: string
  language: string
  input?: string
}

/**
 * Execute code from a file or inline code
 */
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/execution/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to execute code" }))
      return {
        success: false,
        error: error.detail || `Execution failed: ${response.statusText}`
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error executing code:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Detect language from file extension
 */
export function detectLanguageFromPath(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    'jsx': 'javascript',
    'ts': 'javascript',
    'tsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'sh': 'bash',
    'bash': 'bash',
  }

  return languageMap[ext || ''] || null
}
