"use client"

import { useRef, useEffect, useState } from "react"
import { MessageSquare, Code, RefreshCw, TestTube, GitCommit, Settings, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAgent } from "@/features/agent/use-agent"
import { Message } from "@/features/agent/message"
import { PromptInput } from "@/features/agent/prompt-input"
import { createAgentSession, sendAgentMessage, connectAgentStream } from "@/lib/api/agent"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AgentSidebar() {
  const {
    messages,
    isStreaming,
    activeMode,
    contextSources,
    addMessage,
    setStreaming,
    setActiveMode,
    toggleContextSource,
    clearMessages,
  } = useAgent()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState<string>("")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentResponse])

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const newSessionId = await createAgentSession({
          model: "gpt-4o-mini",
          allow_tools: ["fs", "exec", "http", "search"],
        })
        setSessionId(newSessionId)
        setError(null)
        console.log("AI session created:", newSessionId)
      } catch (error) {
        console.error("Failed to create AI session:", error)
        setError("Failed to connect to AI service. Please check if the backend and AI agent service are running.")
      }
    }

    initSession()

    return () => {
      // Cleanup WebSocket on unmount
      if (wsConnection) {
        wsConnection.close()
      }
    }
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!sessionId) {
      setError("No active AI session. Please refresh the page.")
      return
    }

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content,
      createdAt: new Date().toISOString(),
    }
    addMessage(userMessage)

    // Clear previous error
    setError(null)
    setStreaming(true)
    setCurrentResponse("")

    try {
      // Use WebSocket for streaming
      const ws = connectAgentStream(sessionId)
      setWsConnection(ws)

      const assistantMsgId = `msg-${Date.now() + 1}`

      ws.onopen = () => {
        console.log("WebSocket connected, sending message...")
        // Send message via WebSocket
        ws.send(
          JSON.stringify({
            text: content,
            context: {
              mode: activeMode,
              sources: contextSources,
            },
          })
        )
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received WebSocket message:", data.type)

          if (data.type === "content") {
            // Streaming content
            setCurrentResponse((prev) => {
              const newContent = prev + data.content
              // Update message in place
              addMessage({
                id: assistantMsgId,
                role: "assistant" as const,
                content: newContent,
                createdAt: new Date().toISOString(),
              })
              return newContent
            })
          } else if (data.type === "tool_call") {
            // Tool execution
            const toolInfo = `\n\n🔧 **Executing tool:** ${data.tool_name}\n`
            setCurrentResponse((prev) => {
              const newContent = prev + toolInfo
              addMessage({
                id: assistantMsgId,
                role: "assistant" as const,
                content: newContent,
                createdAt: new Date().toISOString(),
              })
              return newContent
            })
          } else if (data.type === "tool_result") {
            // Tool result
            const toolResult = `✓ Tool completed successfully\n\n`
            setCurrentResponse((prev) => {
              const newContent = prev + toolResult
              addMessage({
                id: assistantMsgId,
                role: "assistant" as const,
                content: newContent,
                createdAt: new Date().toISOString(),
              })
              return newContent
            })
          } else if (data.type === "done") {
            // Response complete
            console.log("Streaming complete")
            setStreaming(false)
            setCurrentResponse("")
            ws.close()
          } else if (data.type === "error") {
            // Error occurred
            setError(data.message || "An error occurred during processing")
            setStreaming(false)
            setCurrentResponse("")
            ws.close()
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
          setError("Failed to parse response from AI")
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setError("Connection error. The AI service may not be running.")
        setStreaming(false)
        setCurrentResponse("")
      }

      ws.onclose = () => {
        console.log("WebSocket closed")
        setStreaming(false)
        setWsConnection(null)
        setCurrentResponse("")
      }
    } catch (error) {
      console.error("Failed to connect to AI:", error)
      setError("Failed to connect to AI service. Please ensure the agent service is running on port 9001.")
      setStreaming(false)
      setCurrentResponse("")

      // Fallback to non-streaming API
      try {
        console.log("Attempting fallback to non-streaming API...")
        const response = await sendAgentMessage(sessionId, content)
        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant" as const,
          content: response.content || "I received your message but couldn't generate a response.",
          createdAt: new Date().toISOString(),
        }
        addMessage(assistantMessage)
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
        const errorMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant" as const,
          content: "❌ Sorry, I'm unable to respond right now. Please make sure:\n1. The backend server is running (port 8787)\n2. The AI agent service is running (port 9001)\n3. Your OpenAI API key is configured in backend/.env",
          createdAt: new Date().toISOString(),
        }
        addMessage(errorMessage)
      }
    }
  }

  const modes = [
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "explain", icon: Code, label: "Explain" },
    { id: "refactor", icon: RefreshCw, label: "Refactor" },
    { id: "test", icon: TestTube, label: "Test" },
    { id: "commit", icon: GitCommit, label: "Commit" },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-panel-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">AI Assistant</h2>
          <div className="flex items-center gap-1">
            {sessionId && (
              <span className="text-xs text-green-500 mr-2">● Connected</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-text-secondary hover:text-text-primary"
              onClick={clearMessages}
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-text-secondary hover:text-text-primary"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Mode Tabs */}
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as any)} className="w-full">
          <TabsList className="w-full h-8 bg-canvas p-0.5">
            {modes.map((mode) => {
              const Icon = mode.icon
              return (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  className="flex-1 h-7 text-xs data-[state=active]:bg-accent-blue data-[state=active]:text-white"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {mode.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Context Sources */}
      <div className="px-4 py-2 border-b border-panel-border flex gap-2 flex-wrap">
        <button
          onClick={() => toggleContextSource("activeFile")}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            contextSources.activeFile
              ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
              : "bg-panel-border text-text-secondary hover:text-text-primary"
          }`}
        >
          Active file
        </button>
        <button
          onClick={() => toggleContextSource("selection")}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            contextSources.selection
              ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
              : "bg-panel-border text-text-secondary hover:text-text-primary"
          }`}
        >
          Selection
        </button>
        <button
          onClick={() => toggleContextSource("projectSummary")}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            contextSources.projectSummary
              ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
              : "bg-panel-border text-text-secondary hover:text-text-primary"
          }`}
        >
          Project
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <MessageSquare className="w-12 h-12 text-text-muted mb-4" />
            <h3 className="text-sm font-semibold text-text-primary mb-2">Start a conversation</h3>
            <p className="text-xs text-text-secondary mb-4">
              Ask me to explain code, refactor functions, write tests, or generate commit messages.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button
                className="text-left px-3 py-2 bg-panel hover:bg-panel-border border border-panel-border rounded text-xs text-text-primary transition-colors"
                onClick={() => handleSendMessage("Explain this function")}
              >
                Explain this function
              </button>
              <button
                className="text-left px-3 py-2 bg-panel hover:bg-panel-border border border-panel-border rounded text-xs text-text-primary transition-colors"
                onClick={() => handleSendMessage("Refactor to async/await")}
              >
                Refactor to async/await
              </button>
              <button
                className="text-left px-3 py-2 bg-panel hover:bg-panel-border border border-panel-border rounded text-xs text-text-primary transition-colors"
                onClick={() => handleSendMessage("Write unit tests")}
              >
                Write unit tests
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isStreaming && (
              <div className="flex items-center gap-2 text-text-muted text-sm mt-4">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-accent-blue rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-accent-blue rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-accent-blue rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <PromptInput onSend={handleSendMessage} disabled={isStreaming || !sessionId} />
    </div>
  )
}
