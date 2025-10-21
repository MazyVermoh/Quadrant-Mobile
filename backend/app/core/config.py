from functools import lru_cache
from typing import Any

from pydantic import Field, HttpUrl, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str = "Quadrant API"
    version: str = "0.1.0"
    environment: str = Field(default="development", env="ENVIRONMENT")
    api_prefix: str = "/api/v1"

    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://user:pass@localhost:5432/quadrant"
    )
    redis_url: str = Field(default="redis://localhost:6379/0")

    jwt_secret: str = Field(default="change-me", env="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    telegram_bot_token: str = Field(default="dummy", env="TELEGRAM_BOT_TOKEN")
    telegram_bot_domain: HttpUrl | None = Field(default=None, env="TELEGRAM_BOT_DOMAIN")

    strava_client_id: str | None = Field(default=None, env="STRAVA_CLIENT_ID")
    strava_client_secret: str | None = Field(default=None, env="STRAVA_CLIENT_SECRET")
    strava_redirect_uri: HttpUrl | None = Field(default=None, env="STRAVA_REDIRECT_URI")

    ton_manifest_url: HttpUrl | None = Field(default=None, env="TON_MANIFEST_URL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
