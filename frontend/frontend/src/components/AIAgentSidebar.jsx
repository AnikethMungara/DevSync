"use client"

import { useState, useEffect, useRef } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { formatMarkdown } from "../utils/helpers"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787"

// Store for AI chat history per project
const useAIChatStore = create(
  persist(
    (set, get) => ({
      chats: {}, // { [projectId]: { messages: [], isGenerating: false } }
      addMessage: (projectId, message) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [projectId]: {
              ...state.chats[projectId],
              messages: [...(state.chats[projectId]?.messages || []), message],
            },
          },
        })),
      setGenerating: (projectId, isGenerating) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [projectId]: {
              ...state.chats[projectId],
              isGenerating,
            },
          },
        })),
      clearChat: (projectId) =>
        set((state) => ({
          chats: {
            ...state.chats,
            [projectId]: { messages: [], isGenerating: false },
          },
        })),
    }),
    { name: "ai-chat-store" },
  ),
)

export default function AIAgentSidebar({ projectId, activeFile, fileContent }) {
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  const chats = useAIChatStore((state) => state.chats)
  const addMessage = useAIChatStore((state) => state.addMessage)
  const setGenerating = useAIChatStore((state) => state.setGenerating)
  const clearChat = useAIChatStore((state) => state.clearChat)

  const currentChat = chats[projectId] || { messages: [], isGenerating: false }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentChat.messages])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    }

    addMessage(projectId, userMessage)
    setInput("")
    setIsStreaming(true)
    setGenerating(projectId, true)

    // Prepare context
    const context = activeFile && fileContent ? { path: activeFile, content: fileContent } : null

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          context,
          history: currentChat.messages.slice(-10), // Last 10 messages for context
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error("AI request failed")

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const assistantMessage = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                assistantMessage.content += parsed.content
                // Update the last message in real-time
                addMessage(projectId, { ...assistantMessage })
              }
            } catch (err) {
              console.warn("[AI] Parse error:", err)
            }
          }
        }
      }

      // Final message update
      if (assistantMessage.content) {
        addMessage(projectId, assistantMessage)
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("[AI] Request cancelled")
      } else {
        console.error("[AI] Error:", err)
        addMessage(projectId, {
          role: "system",
          content: "Error: Failed to get AI response. Please try again.",
          timestamp: Date.now(),
        })
      }
    } finally {
      setIsStreaming(false)
      setGenerating(projectId, false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setGenerating(projectId, false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    if (confirm("Clear all chat history for this project?")) {
      clearChat(projectId)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => console.log("[AI] Copied to clipboard"),
      (err) => console.error("[AI] Copy failed:", err),
    )
  }

  return (
    <div className="ai-agent-sidebar">
      <div className="ai-agent-sidebar__header">
        <span className="ai-agent-sidebar__title">AI Agent</span>
        <button className="ai-agent-sidebar__clear-btn" onClick={handleClearChat} title="Clear chat">
          🗑️
        </button>
      </div>

      {activeFile && (
        <div className="ai-agent-sidebar__context">
          <span className="ai-agent-sidebar__context-label">Using context:</span>
          <span className="ai-agent-sidebar__context-file">{activeFile}</span>
        </div>
      )}

      <div className="ai-agent-sidebar__messages">
        {currentChat.messages.length === 0 && (
          <div className="ai-agent-sidebar__empty">
            <p>Ask me anything about your code!</p>
            <p className="ai-agent-sidebar__empty-hint">
              I can help you understand code, suggest improvements, or answer questions.
            </p>
          </div>
        )}

        {currentChat.messages.map((message, i) => (
          <div key={i} className={`ai-message ai-message--${message.role}`}>
            <div className="ai-message__header">
              <span className="ai-message__role">
                {message.role === "user" ? "You" : message.role === "assistant" ? "AI" : "System"}
              </span>
              <span className="ai-message__time">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="ai-message__content">
              {message.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
              ) : (
                <div>{message.content}</div>
              )}
            </div>
            {message.role === "assistant" && (
              <div className="ai-message__actions">
                <button
                  className="ai-message__action-btn"
                  onClick={() => copyToClipboard(message.content)}
                  title="Copy"
                >
                  📋 Copy
                </button>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="ai-agent-sidebar__input-container">
        <textarea
          className="ai-agent-sidebar__input"
          placeholder="Ask AI for help..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isStreaming}
        />
        <div className="ai-agent-sidebar__input-actions">
          {isStreaming ? (
            <button className="ai-agent-sidebar__send-btn ai-agent-sidebar__send-btn--stop" onClick={handleStop}>
              ⏹️ Stop
            </button>
          ) : (
            <button
              className="ai-agent-sidebar__send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send (Enter)"
            >
              ➤ Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
