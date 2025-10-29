# === CORE FILE ===
# SAFE TO EDIT
# Purpose: define application-wide settings and environment variables using Pydantic.

from pydantic import BaseSettings


class Settings(BaseSettings):
    DEVSYNC_WORKDIR: str = "./workspace"
    DATABASE_URL: str = "sqlite:///./devsync.db"
    JWT_SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()
