"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createFile, updateFile, deleteFile, getFileContent } from "@/lib/api/files"

/**
 * Test component for file CRUD operations
 * This demonstrates how to use the file API functions
 */
export function FileOperationsTest() {
  const [filePath, setFilePath] = useState("sample-project/test.txt")
  const [fileContent, setFileContent] = useState("Hello from DevSync!")
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleCreateFile = async () => {
    setLoading(true)
    setResult("")
    try {
      await createFile(filePath, fileContent, false)
      setResult(`✅ File created successfully: ${filePath}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    setLoading(true)
    setResult("")
    try {
      await createFile(filePath, "", true)
      setResult(`✅ Folder created successfully: ${filePath}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReadFile = async () => {
    setLoading(true)
    setResult("")
    try {
      const content = await getFileContent(filePath)
      setFileContent(content.content)
      setResult(`✅ File read successfully. Content loaded into textarea.`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateFile = async () => {
    setLoading(true)
    setResult("")
    try {
      await updateFile(filePath, fileContent)
      setResult(`✅ File updated successfully: ${filePath}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async () => {
    setLoading(true)
    setResult("")
    try {
      await deleteFile(filePath)
      setResult(`✅ File deleted successfully: ${filePath}`)
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>File CRUD Operations Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">File Path:</label>
          <Input
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="sample-project/test.txt"
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Path relative to backend workspace directory
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">File Content:</label>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="w-full min-h-[100px] p-2 border rounded font-mono text-sm"
            placeholder="Enter file content..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleCreateFile} disabled={loading}>
            Create File
          </Button>
          <Button onClick={handleCreateFolder} disabled={loading} variant="outline">
            Create Folder
          </Button>
          <Button onClick={handleReadFile} disabled={loading} variant="secondary">
            Read File
          </Button>
          <Button onClick={handleUpdateFile} disabled={loading} variant="secondary">
            Update File
          </Button>
          <Button onClick={handleDeleteFile} disabled={loading} variant="destructive">
            Delete File
          </Button>
        </div>

        {result && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono whitespace-pre-wrap">
            {result}
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h3 className="font-medium text-sm">How to use:</h3>
          <ol className="text-sm space-y-1 text-gray-600 dark:text-gray-400 list-decimal list-inside">
            <li>Make sure backend is running on port 8787</li>
            <li>Ensure you have a project in backend/workspace/</li>
            <li>Enter a file path (e.g., "sample-project/test.txt")</li>
            <li>Click "Create File" to create a new file</li>
            <li>Click "Read File" to load existing content</li>
            <li>Modify content and click "Update File" to save</li>
            <li>Click "Delete File" to remove it</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
