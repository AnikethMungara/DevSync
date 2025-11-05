"""Session manager for agent conversations"""
import uuid
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from app.agent.types import Message, MessageRole
from app.agent.provider_registry import registry
from app.agent.tool_schema import get_tools_for_categories, AGENT_SYSTEM_PROMPT
from app.agent.tool_executor import execute_tool
from app.agent.types import ChatOptions, ChatChunk, ChatChunkType
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class AgentSession:
    """A conversation session with an AI agent"""

    def __init__(
        self,
        session_id: str,
        model: Optional[str] = None,
        allow_tools: Optional[List[str]] = None,
        temperature: float = 0.7
    ):
        self.session_id = session_id
        self.model = model or settings.AI_MODEL
        self.temperature = temperature
        self.messages: List[Message] = []
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.is_cancelled = False

        # Validate and set allowed tools
        if allow_tools:
            self.allowed_tools = allow_tools
        else:
            self.allowed_tools = settings.get_allowed_tools_list()

        # Get tools based on allowed categories
        self.tools = get_tools_for_categories(self.allowed_tools)

        # Get provider
        self.provider = registry.get_default_provider()

    def add_message(self, role: MessageRole, content: str, **kwargs):
        """Add a message to the conversation"""
        msg = Message(role=role, content=content, **kwargs)
        self.messages.append(msg)
        self.last_activity = datetime.now()

    async def send_message(self, user_message: str, stream: bool = False):
        """
        Send a message and get response.

        Yields ChatChunk if stream=True, otherwise returns final response.
        """
        # Add user message
        self.add_message(MessageRole.USER, user_message)

        # Prepare chat options
        chat_options = ChatOptions(
            system=AGENT_SYSTEM_PROMPT,
            messages=self.messages,
            tools=self.tools if self.tools else None,
            model=self.model,
            max_tokens=settings.AGENT_MAX_TOKENS,
            temperature=self.temperature,
            stream=stream
        )

        # Get response from provider
        response = await self.provider.chat(chat_options)

        if stream:
            # Streaming response
            return self._handle_streaming_response(response)
        else:
            # Non-streaming response
            return await self._handle_non_streaming_response(response)

    async def _handle_streaming_response(self, response):
        """Handle streaming response with tool calling"""
        assistant_message = ""
        tool_calls_buffer = []

        async for chunk in response:
            if self.is_cancelled:
                yield ChatChunk(type=ChatChunkType.ERROR, error="Cancelled by user")
                return

            # Text chunk
            if chunk.type == ChatChunkType.TEXT:
                assistant_message += chunk.delta or ""
                yield chunk

            # Tool call
            elif chunk.type == ChatChunkType.TOOL_CALL:
                # Execute tool
                yield chunk  # Send tool call notification

                tool_result = await execute_tool(chunk.tool_name, chunk.tool_args)

                # Send tool result
                yield ChatChunk(
                    type=ChatChunkType.TOOL_RESULT,
                    tool_name=chunk.tool_name,
                    tool_result=tool_result,
                    truncated=tool_result.get('truncated', False)
                )

                # Store for next iteration
                tool_calls_buffer.append({
                    "name": chunk.tool_name,
                    "args": chunk.tool_args,
                    "result": tool_result
                })

            # Error
            elif chunk.type == ChatChunkType.ERROR:
                yield chunk
                return

            # Done
            elif chunk.type == ChatChunkType.DONE:
                # Add assistant message
                if assistant_message:
                    self.add_message(MessageRole.ASSISTANT, assistant_message)

                yield chunk
                return

    async def _handle_non_streaming_response(self, response):
        """Handle non-streaming response with tool calling"""
        # Check for tool calls
        if response.tool_calls:
            # Execute tools
            tool_results = []
            for tc in response.tool_calls:
                func = tc["function"]
                args = func["arguments"]
                if isinstance(args, str):
                    import json
                    args = json.loads(args)

                result = await execute_tool(func["name"], args)
                tool_results.append({
                    "name": func["name"],
                    "args": args,
                    "result": result
                })

            # Add assistant message with tool calls
            self.add_message(
                MessageRole.ASSISTANT,
                response.content,
                tool_calls=response.tool_calls
            )

            # Add tool results as messages
            for tr in tool_results:
                self.add_message(
                    MessageRole.TOOL,
                    str(tr["result"]),
                    tool_call_id=tr.get("id", "")
                )

            # Get final response after tools
            final_options = ChatOptions(
                system=AGENT_SYSTEM_PROMPT,
                messages=self.messages,
                model=self.model,
                max_tokens=settings.AGENT_MAX_TOKENS,
                temperature=self.temperature,
                stream=False
            )

            final_response = await self.provider.chat(final_options)
            self.add_message(MessageRole.ASSISTANT, final_response.content)

            return {
                "content": final_response.content,
                "tool_calls": tool_results,
                "usage": final_response.usage
            }

        else:
            # No tool calls, just add message
            self.add_message(MessageRole.ASSISTANT, response.content)

            return {
                "content": response.content,
                "tool_calls": None,
                "usage": response.usage
            }

    def cancel(self):
        """Cancel the current operation"""
        self.is_cancelled = True


class SessionManager:
    """Manages multiple agent sessions"""

    def __init__(self):
        self.sessions: Dict[str, AgentSession] = {}

    def create_session(
        self,
        model: Optional[str] = None,
        allow_tools: Optional[List[str]] = None,
        temperature: float = 0.7
    ) -> str:
        """Create a new agent session"""
        session_id = str(uuid.uuid4())

        # Validate model if provided
        if model and model not in settings.get_allowed_models_list():
            raise ValueError(f"Model not allowed: {model}")

        session = AgentSession(
            session_id=session_id,
            model=model,
            allow_tools=allow_tools,
            temperature=temperature
        )

        self.sessions[session_id] = session
        logger.info(f"Created session: {session_id}")

        return session_id

    def get_session(self, session_id: str) -> AgentSession:
        """Get a session by ID"""
        if session_id not in self.sessions:
            raise ValueError(f"Session not found: {session_id}")
        return self.sessions[session_id]

    def delete_session(self, session_id: str):
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Deleted session: {session_id}")

    def cancel_session(self, session_id: str):
        """Cancel a session's current operation"""
        session = self.get_session(session_id)
        session.cancel()
        logger.info(f"Cancelled session: {session_id}")


# Global session manager
session_manager = SessionManager()
