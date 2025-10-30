const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787"

/**
 * Execute code via the backend execution service
 * @param {Object} params
 * @param {string} params.filePath - Path to the file to execute
 * @param {string} params.code - Code to execute (alternative to filePath)
 * @param {string} params.language - Language to execute (javascript or python)
 * @returns {Promise<Object>} Execution result
 */
export async function executeCode({ filePath, code, language }) {
  const response = await fetch(`${API_URL}/api/execution/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filePath,
      code,
      language,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to execute code')
  }

  return response.json()
}

/**
 * Get list of supported languages for execution
 * @returns {Promise<Object>} List of supported languages
 */
export async function getSupportedLanguages() {
  const response = await fetch(`${API_URL}/api/execution/languages`)

  if (!response.ok) {
    throw new Error('Failed to fetch supported languages')
  }

  return response.json()
}
