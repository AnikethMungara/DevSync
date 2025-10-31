import type { FsNode, FileContent } from "@/lib/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export async function getFileSystem(): Promise<FsNode> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files/tree`)
    if (!response.ok) {
      throw new Error(`Failed to fetch file system: ${response.statusText}`)
    }
    const tree = await response.json()
    return tree
  } catch (error) {
    console.error("Error fetching file system:", error)
    throw error
  }
}

export async function getFileContent(path: string): Promise<FileContent> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files?path=${encodeURIComponent(path)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`)
    }
    const data = await response.json()

    // Determine language from file extension
    const extension = path.split('.').pop()?.toLowerCase() || ""
    let language = "plaintext"

    if (["ts", "tsx"].includes(extension)) language = "typescript"
    else if (["js", "jsx"].includes(extension)) language = "javascript"
    else if (extension === "md") language = "markdown"
    else if (extension === "json") language = "json"
    else if (["html", "htm"].includes(extension)) language = "html"
    else if (extension === "css") language = "css"
    else if (["py"].includes(extension)) language = "python"

    return {
      path,
      content: data.content || "",
      language,
      updatedAt: data.updatedAt || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error fetching file content:", error)
    throw error
  }
}

/**
 * Create a new file or directory
 */
export async function createFile(path: string, content: string = "", isDirectory: boolean = false): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        content,
        isDirectory,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create ${isDirectory ? 'directory' : 'file'}`)
    }

    return true
  } catch (error) {
    console.error(`Error creating ${isDirectory ? 'directory' : 'file'}:`, error)
    throw error
  }
}

/**
 * Update/save file content
 */
export async function updateFile(path: string, content: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        content,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update file")
    }

    return true
  } catch (error) {
    console.error("Error updating file:", error)
    throw error
  }
}

/**
 * Delete a file or directory
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete file")
    }

    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

/**
 * Rename/move a file or directory
 */
export async function renameFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files/rename`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        oldPath,
        newPath,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to rename file")
    }

    return true
  } catch (error) {
    console.error("Error renaming file:", error)
    throw error
  }
}
