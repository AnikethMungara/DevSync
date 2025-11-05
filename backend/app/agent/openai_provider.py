"""OpenAI provider implementation"""
from typing import AsyncIterator, Union
import json
from openai import AsyncOpenAI
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


class OpenAIProvider(ChatProvider):
    """OpenAI chat provider"""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.supported_models = [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ]

    def name(self) -> ProviderType:
        return ProviderType.OPENAI

    def supports_tools(self) -> bool:
        return True

    def validate_model(self, model: str) -> bool:
        return model in self.supported_models

    async def chat(
        self,
        options: ChatOptions
    ) -> Union[ChatResponse, AsyncIterator[ChatChunk]]:
        """Send chat request to OpenAI"""

        # Prepare messages
        messages = []

        # Add system message
        if options.system:
            messages.append({"role": "system", "content": options.system})

        # Add conversation messages
        for msg in options.messages:
            openai_msg = {"role": msg.role.value, "content": msg.content}

            # Add tool calls if present
            if msg.tool_calls:
                openai_msg["tool_calls"] = msg.tool_calls

            # Add tool call ID for tool results
            if msg.role == MessageRole.TOOL and msg.tool_call_id:
                openai_msg["tool_call_id"] = msg.tool_call_id

            messages.append(openai_msg)

        # Prepare tools
        tools = None
        if options.tools:
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters
                    }
                }
                for tool in options.tools
            ]

        # API parameters
        api_params = {
            "model": options.model or settings.AI_MODEL,
            "messages": messages,
            "max_tokens": options.max_tokens or settings.AGENT_MAX_TOKENS,
            "temperature": options.temperature
        }

        if tools:
            api_params["tools"] = tools

        try:
            if options.stream:
                return self._stream_chat(api_params)
            else:
                return await self._non_stream_chat(api_params)

        except Exception as e:
            logger.error(f"OpenAI API error: {e}", exc_info=True)
            if options.stream:
                async def error_stream():
                    yield ChatChunk(
                        type=ChatChunkType.ERROR,
                        error=f"OpenAI API error: {str(e)}"
                    )
                return error_stream()
            else:
                raise

    async def _non_stream_chat(self, api_params: dict) -> ChatResponse:
        """Non-streaming chat"""
        response = await self.client.chat.completions.create(
            stream=False,
            **api_params
        )

        message = response.choices[0].message
        content = message.content or ""

        # Extract tool calls
        tool_calls = None
        if message.tool_calls:
            tool_calls = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in message.tool_calls
            ]

        return ChatResponse(
            content=content,
            tool_calls=tool_calls,
            finish_reason=response.choices[0].finish_reason,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        )

    async def _stream_chat(self, api_params: dict) -> AsyncIterator[ChatChunk]:
        """Streaming chat"""
        async def stream_generator():
            try:
                stream = await self.client.chat.completions.create(
                    stream=True,
                    **api_params
                )

                async for chunk in stream:
                    if not chunk.choices:
                        continue

                    delta = chunk.choices[0].delta

                    # Text content
                    if delta.content:
                        yield ChatChunk(
                            type=ChatChunkType.TEXT,
                            delta=delta.content
                        )

                    # Tool calls
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            if tc.function:
                                # Parse tool arguments
                                try:
                                    args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                                except json.JSONDecodeError:
                                    args = {}

                                yield ChatChunk(
                                    type=ChatChunkType.TOOL_CALL,
                                    tool_name=tc.function.name,
                                    tool_args=args
                                )

                    # Check finish reason
                    if chunk.choices[0].finish_reason:
                        yield ChatChunk(type=ChatChunkType.DONE)

            except Exception as e:
                logger.error(f"Stream error: {e}", exc_info=True)
                yield ChatChunk(
                    type=ChatChunkType.ERROR,
                    error=str(e)
                )

        return stream_generator()
