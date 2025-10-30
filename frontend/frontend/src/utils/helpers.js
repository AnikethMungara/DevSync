/**
 * Utility functions for the collaborative code editor
 */

/**
 * Conditionally join class names
 * @param  {...any} classes - Class names or conditional objects
 * @returns {string} Joined class names
 */
export function cn(...classes) {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === "string") return c
      if (typeof c === "object") {
        return Object.keys(c)
          .filter((key) => c[key])
          .join(" ")
      }
      return ""
    })
    .join(" ")
    .trim()
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Get file extension from path
 * @param {string} path - File path
 * @returns {string} File extension
 */
export function getFileExtension(path) {
  const parts = path.split(".")
  return parts.length > 1 ? parts[parts.length - 1] : ""
}

/**
 * Get file name from path
 * @param {string} path - File path
 * @returns {string} File name
 */
export function getFileName(path) {
  return path.split("/").pop() || path
}

/**
 * Get language from file extension
 * @param {string} path - File path
 * @returns {string} Monaco language identifier
 */
export function getLanguageFromPath(path) {
  const ext = getFileExtension(path)
  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
    sh: "shell",
    sql: "sql",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
  }
  return languageMap[ext] || "plaintext"
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Generate random color for user avatars
 * @param {string} seed - Seed string for consistent colors
 * @returns {string} Hex color
 */
export function generateColor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

/**
 * Get initials from name
 * @param {string} name - User name
 * @returns {string} Initials
 */
export function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Simple formatter stub (can be replaced with Prettier worker)
 * @param {string} code - Code to format
 * @param {string} language - Language identifier
 * @returns {Promise<string>} Formatted code
 */
export async function formatCode(code, language) {
  // TODO: Implement Prettier formatting in web worker
  // For now, just return the code as-is
  return code
}

/**
 * Validate file path
 * @param {string} path - File path
 * @returns {boolean} Is valid
 */
export function isValidPath(path) {
  if (!path || typeof path !== "string") return false
  if (path.includes("..")) return false
  if (path.includes("//")) return false
  return true
}

/**
 * Parse error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function parseError(error) {
  if (error.message) return error.message
  if (typeof error === "string") return error
  return "An unknown error occurred"
}

/**
 * Format markdown to HTML (basic implementation)
 * @param {string} content - Markdown content
 * @returns {string} HTML string
 */
export function formatMarkdown(content) {
  if (!content) return ""

  let html = content

  // Code blocks with language
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || "plaintext"
    return `<pre class="code-block"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>")

  // Links
  html = html.replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  return html
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Safe localStorage wrapper with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store (undefined to get)
 * @returns {any} Retrieved value or undefined
 */
export function safeLocalStorage(key, value) {
  try {
    if (value === undefined) {
      // Get
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : undefined
    } else {
      // Set
      localStorage.setItem(key, JSON.stringify(value))
      return value
    }
  } catch (err) {
    console.warn("[Storage] Error:", err)
    return undefined
  }
}
