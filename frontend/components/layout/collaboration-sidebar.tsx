"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Share2,
  MessageSquare,
  Send,
  Copy,
  Check,
  UserPlus,
  Radio,
} from "lucide-react"
import {
  useCollaboration,
  CollaborationUser,
  ChatMessage,
} from "@/hooks/use-collaboration"
import { useCollaborationStore } from "@/lib/store/collaboration-store"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787"

export function CollaborationSidebar() {
  const {
    sessionId,
    userName,
    isEnabled,
    setUserName,
    createSession: createStoreSession,
    joinSession: joinStoreSession,
    leaveSession: leaveStoreSession,
  } = useCollaborationStore()

  const [showJoinForm, setShowJoinForm] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [copiedLink, setCopiedLink] = useState(false)
  const [localUserName, setLocalUserName] = useState(userName)

  const chatScrollRef = useRef<HTMLDivElement>(null)

  const {
    isConnected,
    sessionState,
    myUserId,
    error,
    sendChatMessage,
  } = useCollaboration({
    sessionId,
    userName,
    onUserJoined: (user) => {
      setChatMessages((prev) => [
        ...prev,
        {
          user_id: "system",
          user_name: "System",
          user_color: "#888888",
          message: `${user.name} joined the session`,
          timestamp: new Date().toISOString(),
        },
      ])
    },
    onUserLeft: (userId) => {
      const user = sessionState?.users.find((u) => u.id === userId)
      if (user) {
        setChatMessages((prev) => [
          ...prev,
          {
            user_id: "system",
            user_name: "System",
            user_color: "#888888",
            message: `${user.name} left the session`,
            timestamp: new Date().toISOString(),
          },
        ])
      }
    },
    onChatMessage: (message) => {
      setChatMessages((prev) => [...prev, message])
    },
  })

  useEffect(() => {
    setLocalUserName(userName)
  }, [userName])

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const createNewSession = async () => {
    if (!localUserName.trim()) {
      alert("Please enter your name")
      return
    }

    try {
      setUserName(localUserName)
      await createStoreSession()
      setShowJoinForm(false)
    } catch (error) {
      console.error("Failed to create session:", error)
      alert("Failed to create session")
    }
  }

  const joinSession = (joinSessionId: string) => {
    if (!localUserName.trim()) {
      alert("Please enter your name")
      return
    }

    setUserName(localUserName)
    joinStoreSession(joinSessionId)
    setShowJoinForm(false)
  }

  const leaveSession = () => {
    leaveStoreSession()
    setChatMessages([])
  }

  const copySessionLink = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendChatMessage(chatInput)
      setChatInput("")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h2 className="font-semibold">Collaboration</h2>
          </div>
          {isConnected && (
            <Badge variant="outline" className="gap-1">
              <Radio className="h-2 w-2 fill-green-500 text-green-500" />
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Not Connected State */}
      {!sessionId && (
        <div className="flex-1 p-4 space-y-4">
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Start Collaborating</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Work together in real-time with your team
            </p>

            <div className="space-y-3">
              <Input
                placeholder="Your name"
                value={localUserName}
                onChange={(e) => setLocalUserName(e.target.value)}
              />

              <Button className="w-full" onClick={createNewSession}>
                <UserPlus className="h-4 w-4 mr-2" />
                Start New Session
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowJoinForm(!showJoinForm)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Join Session
              </Button>

              {showJoinForm && (
                <div className="space-y-2">
                  <Input
                    placeholder="Session ID"
                    onChange={(e) => {
                      if (e.target.value) {
                        joinSession(e.target.value)
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connected State */}
      {sessionId && isConnected && sessionState && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Session Info */}
          <div className="p-4 space-y-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session ID</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copySessionLink}
                className="h-7"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="font-mono text-xs bg-muted p-2 rounded break-all">
              {sessionId}
            </div>
            <Button variant="outline" size="sm" onClick={leaveSession} className="w-full">
              Leave Session
            </Button>
          </div>

          {/* Active Users */}
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium mb-3">
              Active Users ({sessionState.user_count})
            </h3>
            <div className="space-y-2">
              {sessionState.users.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6" style={{ backgroundColor: user.color }}>
                    <AvatarFallback style={{ backgroundColor: user.color, color: "white" }}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {user.name}
                    {user.id === myUserId && " (You)"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h3 className="text-sm font-medium">Chat</h3>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="space-y-1">
                    {msg.user_id === "system" ? (
                      <div className="text-xs text-center text-muted-foreground italic">
                        {msg.message}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5" style={{ backgroundColor: msg.user_color }}>
                            <AvatarFallback
                              style={{ backgroundColor: msg.user_color, color: "white" }}
                            >
                              {getInitials(msg.user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{msg.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-sm ml-7">{msg.message}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage()
                    }
                  }}
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 text-sm text-red-500">
          Error: {error}
        </div>
      )}
    </div>
  )
}
