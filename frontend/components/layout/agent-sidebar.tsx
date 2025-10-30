"use client"

import { useRef, useEffect } from "react"
import { MessageSquare, Code, RefreshCw, TestTube, GitCommit, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAgent } from "@/features/agent/use-agent"
import { Message } from "@/features/agent/message"
import { PromptInput } from "@/features/agent/prompt-input"
import { sendAgentMessage } from "@/lib/api/agent"
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content,
      createdAt: new Date().toISOString(),
    }
    addMessage(userMessage)

    // Get AI response
    setStreaming(true)
    try {
      const response = await sendAgentMessage(content, {
        mode: activeMode,
        sources: contextSources,
      })
      addMessage(response)
    } catch (error) {
      console.error("Failed to get AI response:", error)
    } finally {
      setStreaming(false)
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-text-secondary hover:text-text-primary"
              onClick={clearMessages}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-text-secondary hover:text-text-primary">
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
              <button className="text-left px-3 py-2 bg-panel hover:bg-panel-border border border-panel-border rounded text-xs text-text-primary transition-colors">
                Explain this function
              </button>
              <button className="text-left px-3 py-2 bg-panel hover:bg-panel-border border border-panel-border rounded text-xs text-text-primary transition-colors">
                Refactor to async/await
              </button>
              <button className="text-left px-3 py-2 bg-panel hover:bg-panel-border border border-panel-border rounded text-xs text-text-primary transition-colors">
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
              <div className="flex items-center gap-2 text-text-muted text-sm">
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
      <PromptInput onSend={handleSendMessage} disabled={isStreaming} />
    </div>
  )
}
