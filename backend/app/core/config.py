# === CORE FILE ===
# SAFE TO EDIT
# Purpose: define application-wide settings and environment variables using Pydantic.

from pydantic import BaseSettings


class Settings(BaseSettings):
    DEVSYNC_WORKDIR: str = "./workspace"
    DATABASE_URL: str = "sqlite:///./devsync.db"


settings = Settings()
