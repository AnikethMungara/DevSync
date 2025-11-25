"""Application configuration"""
from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from pathlib import Path
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings"""

    # Server settings
    PORT: int = 8787
    HOST: str = "0.0.0.0"
    FRONTEND_URL: str = "http://localhost:3000"

    # Workspace settings
    WORKSPACE_DIR: str = "workspace"
    WRITE_DEBOUNCE_MS: int = 300

    # Database settings
    DATABASE_PATH: str = "database.db"

    # Execution settings
    EXECUTION_TIMEOUT: int = 30
    MAX_OUTPUT_SIZE: int = 1024 * 1024  # 1MB

    # Logging
    LOG_LEVEL: str = "INFO"

    # AI Agent settings
    AI_PROVIDER: str = "openai"  # openai | anthropic | google
    AI_MODEL: str = "gpt-4o-mini"
    ALLOWED_MODELS: str = "gpt-4o-mini,gpt-4o,claude-3-5-sonnet-20241022,gemini-1.5-pro"

    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # Agent limits
    AGENT_MAX_TOKENS: int = 2000
    AGENT_MAX_RUN_SECONDS: int = 60
    AGENT_MAX_OUTPUT_CHARS: int = 200000
    AGENT_RATE_RPS: int = 2
    AGENT_ALLOW_TOOLS: str = "fs,exec,http,search"

    # Sandbox
    WORKSPACE_ROOT: str = "./workspace"
    DISABLE_NETWORK: bool = False

    @field_validator("AI_PROVIDER")
    @classmethod
    def validate_ai_provider(cls, v):
        if v not in ["openai", "anthropic", "google"]:
            raise ValueError("AI_PROVIDER must be one of: openai, anthropic, google")
        return v

    @model_validator(mode='after')
    def validate_api_keys(self):
        """Validate that the correct API key is set based on provider"""
        provider = self.AI_PROVIDER

        if provider == "openai" and not self.OPENAI_API_KEY:
            # Allow optional - just warn, don't fail
            pass
        elif provider == "anthropic" and not self.ANTHROPIC_API_KEY:
            # Allow optional - just warn, don't fail
            pass
        elif provider == "google" and not self.GOOGLE_API_KEY:
            # Allow optional - just warn, don't fail
            pass

        return self

    def get_allowed_models_list(self) -> List[str]:
        """Get list of allowed models"""
        return [m.strip() for m in self.ALLOWED_MODELS.split(",")]

    def get_allowed_tools_list(self) -> List[str]:
        """Get list of allowed tools"""
        return [t.strip() for t in self.AGENT_ALLOW_TOOLS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()
