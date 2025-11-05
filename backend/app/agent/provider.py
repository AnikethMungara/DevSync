"""Provider interface for AI models"""
from abc import ABC, abstractmethod
from typing import AsyncIterator, Union
from app.agent.types import (
    ChatOptions,
    ChatResponse,
    ChatChunk,
    ProviderType
)


class ChatProvider(ABC):
    """Abstract base class for chat providers"""

    @abstractmethod
    def name(self) -> ProviderType:
        """Get provider name"""
        pass

    @abstractmethod
    def supports_tools(self) -> bool:
        """Check if provider supports tool calling"""
        pass

    @abstractmethod
    async def chat(
        self,
        options: ChatOptions
    ) -> Union[ChatResponse, AsyncIterator[ChatChunk]]:
        """
        Send chat request to provider.

        Returns:
            ChatResponse if stream=False
            AsyncIterator[ChatChunk] if stream=True
        """
        pass

    @abstractmethod
    def validate_model(self, model: str) -> bool:
        """Validate if model is supported by this provider"""
        pass
