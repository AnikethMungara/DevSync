"""Type definitions for AI Agent"""
from typing import Dict, List, Optional, Any, Literal, AsyncIterator
from pydantic import BaseModel
from enum import Enum


class MessageRole(str, Enum):
    """Message roles"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class Message(BaseModel):
    """Chat message"""
    role: MessageRole
    content: str
    tool_call_id: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None


class ToolSpec(BaseModel):
    """Tool specification in JSON schema format"""
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON schema


class ChatChunkType(str, Enum):
    """Types of streaming chunks"""
    TEXT = "text"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    ERROR = "error"
    DONE = "done"


class ChatChunk(BaseModel):
    """Streaming chat chunk"""
    type: ChatChunkType
    delta: Optional[str] = None  # For text chunks
    tool_name: Optional[str] = None  # For tool calls
    tool_args: Optional[Dict[str, Any]] = None  # For tool calls
    tool_result: Optional[Any] = None  # For tool results
    error: Optional[str] = None  # For errors
    truncated: bool = False


class ChatOptions(BaseModel):
    """Chat options"""
    system: str
    messages: List[Message]
    tools: Optional[List[ToolSpec]] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.7
    stream: bool = False


class ChatResponse(BaseModel):
    """Non-streaming chat response"""
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, int]] = None


class ProviderType(str, Enum):
    """Supported providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
