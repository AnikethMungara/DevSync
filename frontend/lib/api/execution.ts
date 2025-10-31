const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export interface ExecutionResult {
  success: boolean
  result?: {
    exitCode: number
    stdout: string
    stderr: string
    success: boolean
  }
  error?: string
}

export interface Language {
  id: string
  name: string
  extensions: string[]
  runtime: string
}

export interface ExecutionRequest {
  filePath?: string
  code?: string
  language: string
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
      const error = await response.json().catch(() => ({ error: "Failed to execute code" }))
      throw new Error(error.error || `Execution failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error executing code:", error)
    throw error
  }
}

/**
 * Get list of supported languages
 */
export async function getSupportedLanguages(): Promise<Language[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/execution/languages`)

    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.languages || []
  } catch (error) {
    console.error("Error fetching supported languages:", error)
    throw error
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
  }

  return languageMap[ext || ''] || null
}
