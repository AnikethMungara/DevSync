"""Provider registry for AI models"""
from typing import Optional
from app.agent.provider import ChatProvider
from app.agent.openai_provider import OpenAIProvider
from app.agent.anthropic_provider import AnthropicProvider
# from app.agent.gemini_provider import GeminiProvider  # TODO: Implement
from app.agent.types import ProviderType
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class ProviderRegistry:
    """Registry for managing AI providers"""

    def __init__(self):
        self.providers: dict[ProviderType, ChatProvider] = {}
        self._initialized: set[ProviderType] = set()
        logger.info("Provider registry created (using lazy initialization)")

    def _ensure_provider_initialized(self, provider_type: ProviderType):
        """Lazily initialize a provider when first accessed"""
        if provider_type in self._initialized:
            return

        try:
            if provider_type == ProviderType.OPENAI:
                if settings.OPENAI_API_KEY:
                    self.providers[provider_type] = OpenAIProvider()
                    logger.info("OpenAI provider initialized")
                else:
                    logger.warning("OpenAI API key not configured")

            elif provider_type == ProviderType.ANTHROPIC:
                if settings.ANTHROPIC_API_KEY:
                    self.providers[provider_type] = AnthropicProvider()
                    logger.info("Anthropic provider initialized")
                else:
                    logger.warning("Anthropic API key not configured")

            # elif provider_type == ProviderType.GOOGLE:
            #     if settings.GOOGLE_API_KEY:
            #         self.providers[provider_type] = GeminiProvider()
            #         logger.info("Google provider initialized")
            #     else:
            #         logger.warning("Google API key not configured")

            self._initialized.add(provider_type)

        except Exception as e:
            logger.error(f"Failed to initialize {provider_type} provider: {e}", exc_info=True)
            raise

    def get_provider(self, provider_type: Optional[ProviderType] = None) -> ChatProvider:
        """
        Get provider by type, or default provider.

        Args:
            provider_type: Provider type to get, or None for default

        Returns:
            ChatProvider instance

        Raises:
            ValueError: If provider not available
        """
        if provider_type is None:
            # Use default from settings
            provider_type = ProviderType(settings.AI_PROVIDER)

        # Ensure the provider is initialized (lazy loading)
        self._ensure_provider_initialized(provider_type)

        if provider_type not in self.providers:
            raise ValueError(
                f"Provider {provider_type} not available. "
                f"Check API key configuration for {provider_type}."
            )

        return self.providers[provider_type]

    def get_default_provider(self) -> ChatProvider:
        """Get the default provider from settings"""
        return self.get_provider(ProviderType(settings.AI_PROVIDER))

    def list_providers(self) -> list[ProviderType]:
        """List all available providers"""
        return list(self.providers.keys())


# Global registry instance
registry = ProviderRegistry()
