"use client"

import { useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { create } from "zustand"
import * as Y from "yjs"
import { MonacoBinding } from "y-monaco"
import { WebsocketProvider } from "y-websocket"
import { getLanguageFromPath, getFileName, formatCode } from "../utils/helpers"
import { z } from "zod"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787"
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8787/ws"

const FileContentSchema = z.object({
  path: z.string(),
  content: z.string(),
})

// Editor store (imported from App.jsx conceptually, but defined here for clarity)
const useEditorStore = create((set) => ({
  openTabs: [],
  activeTabId: null,
  buffers: {},
  addTab: (path) =>
    set((state) => {
      if (state.openTabs.includes(path)) {
        return { activeTabId: path }
      }
      return {
        openTabs: [...state.openTabs, path],
        activeTabId: path,
        buffers: {
          ...state.buffers,
          [path]: { content: "", dirty: false, ydoc: null },
        },
      }
    }),
  closeTab: (path) =>
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t !== path)
      const newBuffers = { ...state.buffers }
      delete newBuffers[path]
      const newActiveTab = state.activeTabId === path ? newTabs[newTabs.length - 1] || null : state.activeTabId
      return {
        openTabs: newTabs,
        activeTabId: newActiveTab,
        buffers: newBuffers,
      }
    }),
  setActiveTab: (path) => set({ activeTabId: path }),
  updateBuffer: (path, updates) =>
    set((state) => ({
      buffers: {
        ...state.buffers,
        [path]: { ...state.buffers[path], ...updates },
      },
    })),
  markDirty: (path, dirty) =>
    set((state) => ({
      buffers: {
        ...state.buffers,
        [path]: { ...state.buffers[path], dirty },
      },
    })),
}))

// Toast store
const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Date.now()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
}))

// Execution store
const useExecutionStore = create((set) => ({
  isRunning: false,
  output: null,
  showOutput: false,
  setRunning: (isRunning) => set({ isRunning }),
  setOutput: (output) => set({ output, showOutput: true }),
  clearOutput: () => set({ output: null, showOutput: false }),
  toggleOutput: () => set((state) => ({ showOutput: !state.showOutput })),
}))

export default function Editor({ projectId }) {
  const queryClient = useQueryClient()
  const addToast = useToastStore((state) => state.addToast)

  const openTabs = useEditorStore((state) => state.openTabs)
  const activeTabId = useEditorStore((state) => state.activeTabId)
  const buffers = useEditorStore((state) => state.buffers)
  const closeTab = useEditorStore((state) => state.closeTab)
  const setActiveTab = useEditorStore((state) => state.setActiveTab)
  const updateBuffer = useEditorStore((state) => state.updateBuffer)
  const markDirty = useEditorStore((state) => state.markDirty)

  const isRunning = useExecutionStore((state) => state.isRunning)
  const output = useExecutionStore((state) => state.output)
  const showOutput = useExecutionStore((state) => state.showOutput)
  const setRunning = useExecutionStore((state) => state.setRunning)
  const setOutput = useExecutionStore((state) => state.setOutput)
  const clearOutput = useExecutionStore((state) => state.clearOutput)
  const toggleOutput = useExecutionStore((state) => state.toggleOutput)

  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const editorInstanceRef = useRef(null)
  const bindingsRef = useRef(new Map())
  const providersRef = useRef(new Map())

  // Load Monaco
  useEffect(() => {
    let mounted = true

    const loadMonaco = async () => {
      try {
        const monaco = await import("monaco-editor")
        if (mounted) {
          monacoRef.current = monaco

          // Configure Monaco
          monaco.editor.defineTheme("custom-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#1e1e1e",
            },
          })
          monaco.editor.setTheme("custom-dark")
        }
      } catch (err) {
        console.error("Failed to load Monaco:", err)
        addToast("Failed to load editor", "error")
      }
    }

    loadMonaco()
    return () => {
      mounted = false
    }
  }, [addToast])

  // Create editor instance
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current || editorInstanceRef.current) return

    const editor = monacoRef.current.editor.create(editorRef.current, {
      value: "",
      language: "javascript",
      theme: "custom-dark",
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      wordWrap: "on",
    })

    editorInstanceRef.current = editor

    // Save on Ctrl/Cmd+S
    editor.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KeyS, () => {
      if (activeTabId) {
        handleSave(activeTabId)
      }
    })

    // Run on Ctrl/Cmd+Enter
    editor.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.Enter, () => {
      handleRunCode()
    })

    // Track changes for dirty state
    editor.onDidChangeModelContent(() => {
      if (activeTabId && !buffers[activeTabId]?.ydoc) {
        markDirty(activeTabId, true)
      }
    })

    return () => {
      editor.dispose()
      editorInstanceRef.current = null
    }
  }, [monacoRef.current, editorRef.current])

  // Load file content
  const { data: fileData } = useQuery({
    queryKey: ["file", activeTabId],
    queryFn: async () => {
      if (!activeTabId) return null
      const res = await fetch(`${API_URL}/api/files?path=${encodeURIComponent(activeTabId)}`)
      if (!res.ok) throw new Error("Failed to load file")
      const data = await res.json()
      return FileContentSchema.parse(data)
    },
    enabled: !!activeTabId,
  })

  // Update editor when active tab changes
  useEffect(() => {
    if (!editorInstanceRef.current || !monacoRef.current || !activeTabId) return

    const editor = editorInstanceRef.current
    const monaco = monacoRef.current

    // Dispose old binding
    const oldBinding = bindingsRef.current.get(activeTabId)
    if (oldBinding) {
      oldBinding.destroy()
      bindingsRef.current.delete(activeTabId)
    }

    const oldProvider = providersRef.current.get(activeTabId)
    if (oldProvider) {
      oldProvider.destroy()
      providersRef.current.delete(activeTabId)
    }

    // Set language
    const language = getLanguageFromPath(activeTabId)
    const model = monaco.editor.createModel(fileData?.content || buffers[activeTabId]?.content || "", language)
    editor.setModel(model)

    // Setup Yjs collaboration
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText("monaco")

    updateBuffer(activeTabId, { ydoc })

    // Create WebSocket provider for collaboration
    const wsUrl = WS_URL.replace("ws://", "").replace("wss://", "")
    const provider = new WebsocketProvider(wsUrl, `collab:${activeTabId}`, ydoc)

    providersRef.current.set(activeTabId, provider)

    // Bind Yjs to Monaco
    const binding = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness)

    bindingsRef.current.set(activeTabId, binding)

    // Set initial content if not synced yet
    if (fileData?.content && ytext.length === 0) {
      ytext.insert(0, fileData.content)
    }

    return () => {
      model.dispose()
    }
  }, [activeTabId, fileData, monacoRef.current])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ path, content }) => {
      const res = await fetch(`${API_URL}/api/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      })
      if (!res.ok) throw new Error("Failed to save file")
      return res.json()
    },
    onSuccess: (_, variables) => {
      markDirty(variables.path, false)
      addToast("File saved", "success")
      queryClient.invalidateQueries(["file", variables.path])
    },
    onError: () => addToast("Failed to save file", "error"),
  })

  const handleSave = async (path) => {
    if (!editorInstanceRef.current) return

    const content = editorInstanceRef.current.getValue()

    // Format on save
    try {
      const language = getLanguageFromPath(path)
      const formatted = await formatCode(content, language)
      if (formatted !== content) {
        editorInstanceRef.current.setValue(formatted)
      }
    } catch (err) {
      console.warn("Format failed:", err)
    }

    saveMutation.mutate({ path, content: editorInstanceRef.current.getValue() })
  }

  const handleCloseTab = (path, e) => {
    e.stopPropagation()

    if (buffers[path]?.dirty) {
      if (!confirm(`${getFileName(path)} has unsaved changes. Close anyway?`)) {
        return
      }
    }

    // Cleanup Yjs
    const binding = bindingsRef.current.get(path)
    if (binding) {
      binding.destroy()
      bindingsRef.current.delete(path)
    }

    const provider = providersRef.current.get(path)
    if (provider) {
      provider.destroy()
      providersRef.current.delete(path)
    }

    closeTab(path)
  }

  // Execute code mutation
  const executeMutation = useMutation({
    mutationFn: async ({ filePath, code, language }) => {
      const res = await fetch(`${API_URL}/api/execution/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, code, language }),
      })
      if (!res.ok) throw new Error("Failed to execute code")
      return res.json()
    },
    onMutate: () => {
      setRunning(true)
      clearOutput()
    },
    onSuccess: (data) => {
      setRunning(false)
      setOutput(data.result)
      if (data.result.success) {
        addToast("Code executed successfully", "success")
      } else {
        addToast("Execution completed with errors", "error")
      }
    },
    onError: (error) => {
      setRunning(false)
      addToast(`Execution failed: ${error.message}`, "error")
    },
  })

  const handleRunCode = () => {
    if (!activeTabId || !editorInstanceRef.current) {
      addToast("No file open to execute", "error")
      return
    }

    const language = getLanguageFromPath(activeTabId)

    // Map Monaco language to execution service language
    const execLanguage = language === "javascript" ? "javascript" : language === "python" ? "python" : null

    if (!execLanguage) {
      addToast(`Unsupported language for execution: ${language}`, "error")
      return
    }

    const code = editorInstanceRef.current.getValue()

    executeMutation.mutate({
      filePath: activeTabId,
      code,
      language: execLanguage,
    })
  }

  return (
    <div className="editor-container">
      <div className="editor-tabs">
        {openTabs.map((path) => (
          <div
            key={path}
            className={`editor-tab ${activeTabId === path ? "editor-tab--active" : ""}`}
            onClick={() => setActiveTab(path)}
          >
            <span>{getFileName(path)}</span>
            {buffers[path]?.dirty && <span className="editor-tab__dirty">●</span>}
            <button className="editor-tab__close" onClick={(e) => handleCloseTab(path, e)}>
              ×
            </button>
          </div>
        ))}
        {activeTabId && (
          <div className="editor-actions">
            <button
              className="editor-run-btn"
              onClick={handleRunCode}
              disabled={isRunning}
              title="Run code (Ctrl+Enter)"
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
            {output && (
              <button
                className="editor-output-toggle"
                onClick={toggleOutput}
                title={showOutput ? "Hide output" : "Show output"}
              >
                {showOutput ? "Hide Output" : "Show Output"}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="editor-content" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {activeTabId ? (
          <>
            <div
              ref={editorRef}
              style={{
                height: showOutput ? "60%" : "100%",
                width: "100%",
                transition: "height 0.2s ease",
              }}
            />
            {showOutput && output && (
              <div className="editor-output" style={{ height: "40%", overflowY: "auto" }}>
                <div className="editor-output-header">
                  <span>Output</span>
                  <button onClick={clearOutput} title="Clear output">
                    ✕
                  </button>
                </div>
                <div className="editor-output-content">
                  {output.stdout && (
                    <div className="editor-output-section">
                      <div className="editor-output-label">Standard Output:</div>
                      <pre className="editor-output-text editor-output-text--stdout">{output.stdout}</pre>
                    </div>
                  )}
                  {output.stderr && (
                    <div className="editor-output-section">
                      <div className="editor-output-label">Standard Error:</div>
                      <pre className="editor-output-text editor-output-text--stderr">{output.stderr}</pre>
                    </div>
                  )}
                  <div className="editor-output-section">
                    <div className="editor-output-label">Exit Code: {output.exitCode}</div>
                    <div className="editor-output-label">
                      Status: {output.success ? "✓ Success" : "✗ Failed"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="editor-empty">Open a file to start editing</div>
        )}
      </div>
    </div>
  )
}
