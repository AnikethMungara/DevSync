"""Application configuration"""
from pydantic_settings import BaseSettings
from pathlib import Path


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

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()
