"""Anthropic Claude provider implementation"""
from typing import AsyncIterator, Union
import json
from anthropic import AsyncAnthropic
from app.agent.provider import ChatProvider
from app.agent.types import (
    ChatOptions,
    ChatResponse,
    ChatChunk,
    ChatChunkType,
    ProviderType,
    Message,
    MessageRole
)
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class AnthropicProvider(ChatProvider):
    """Anthropic Claude provider"""

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.supported_models = [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307"
        ]

    def name(self) -> ProviderType:
        return ProviderType.ANTHROPIC

    def supports_tools(self) -> bool:
        return True

    def validate_model(self, model: str) -> bool:
        return model in self.supported_models

    async def chat(
        self,
        options: ChatOptions
    ) -> Union[ChatResponse, AsyncIterator[ChatChunk]]:
        """Send chat request to Anthropic"""

        # Prepare messages (Claude doesn't use system in messages array)
        messages = []

        for msg in options.messages:
            # Skip system messages (handled separately)
            if msg.role == MessageRole.SYSTEM:
                continue

            claude_msg = {
                "role": "user" if msg.role == MessageRole.USER else "assistant",
                "content": msg.content
            }

            messages.append(claude_msg)

        # Prepare tools
        tools = None
        if options.tools:
            tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.parameters
                }
                for tool in options.tools
            ]

        # API parameters
        api_params = {
            "model": options.model or settings.AI_MODEL,
            "messages": messages,
            "max_tokens": options.max_tokens or settings.AGENT_MAX_TOKENS,
            "temperature": options.temperature,
            "system": options.system
        }

        if tools:
            api_params["tools"] = tools

        try:
            if options.stream:
                return self._stream_chat(api_params)
            else:
                return await self._non_stream_chat(api_params)

        except Exception as e:
            logger.error(f"Anthropic API error: {e}", exc_info=True)
            if options.stream:
                async def error_stream():
                    yield ChatChunk(
                        type=ChatChunkType.ERROR,
                        error=f"Anthropic API error: {str(e)}"
                    )
                return error_stream()
            else:
                raise

    async def _non_stream_chat(self, api_params: dict) -> ChatResponse:
        """Non-streaming chat"""
        response = await self.client.messages.create(
            stream=False,
            **api_params
        )

        # Extract content
        content = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append({
                    "id": block.id,
                    "type": "function",
                    "function": {
                        "name": block.name,
                        "arguments": json.dumps(block.input)
                    }
                })

        return ChatResponse(
            content=content,
            tool_calls=tool_calls if tool_calls else None,
            finish_reason=response.stop_reason,
            usage={
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens
            }
        )

    async def _stream_chat(self, api_params: dict) -> AsyncIterator[ChatChunk]:
        """Streaming chat"""
        async def stream_generator():
            try:
                async with self.client.messages.stream(**api_params) as stream:
                    async for event in stream:
                        # Text content
                        if event.type == "content_block_delta":
                            if hasattr(event.delta, 'text'):
                                yield ChatChunk(
                                    type=ChatChunkType.TEXT,
                                    delta=event.delta.text
                                )

                        # Tool use
                        elif event.type == "content_block_start":
                            if hasattr(event.content_block, 'name'):
                                # Tool call started
                                pass

                        elif event.type == "content_block_stop":
                            # Check if it was a tool use block
                            if hasattr(event, 'content_block') and event.content_block.type == "tool_use":
                                yield ChatChunk(
                                    type=ChatChunkType.TOOL_CALL,
                                    tool_name=event.content_block.name,
                                    tool_args=event.content_block.input
                                )

                        # Stream end
                        elif event.type == "message_stop":
                            yield ChatChunk(type=ChatChunkType.DONE)

            except Exception as e:
                logger.error(f"Stream error: {e}", exc_info=True)
                yield ChatChunk(
                    type=ChatChunkType.ERROR,
                    error=str(e)
                )

        return stream_generator()
