from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="Nearby Volunteer Backend", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    auth_mode: Literal["max", "dev"] = Field(default="max", alias="AUTH_MODE")
    max_bot_token: str = Field(default="", alias="MAX_BOT_TOKEN")
    max_auth_max_age_seconds: int = Field(default=3600, alias="MAX_AUTH_MAX_AGE_SECONDS")
    max_auth_future_skew_seconds: int = Field(
        default=30,
        alias="MAX_AUTH_FUTURE_SKEW_SECONDS",
    )
    admin_max_ids: str = Field(default="", alias="ADMIN_MAX_IDS")

    postgres_host: str = Field(default="db", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, alias="POSTGRES_PORT")
    postgres_db: str = Field(default="nearby", alias="POSTGRES_DB")
    postgres_user: str = Field(default="nearby", alias="POSTGRES_USER")
    postgres_password: str = Field(
        default="nearby_password", alias="POSTGRES_PASSWORD"
    )

    redis_host: str = Field(default="redis", alias="REDIS_HOST")
    redis_port: int = Field(default=6379, alias="REDIS_PORT")

    minio_endpoint: str = Field(default="minio:9000", alias="MINIO_ENDPOINT")
    minio_public_endpoint: str = Field(
        default="localhost:9000",
        alias="MINIO_PUBLIC_ENDPOINT",
    )
    minio_console_port: int = Field(default=9001, alias="MINIO_CONSOLE_PORT")
    minio_access_key: str = Field(default="minioadmin", alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="minioadmin", alias="MINIO_SECRET_KEY")
    minio_bucket: str = Field(default="nearby-media", alias="MINIO_BUCKET")
    minio_secure: bool = Field(default=False, alias="MINIO_SECURE")
    minio_public_secure: bool = Field(default=False, alias="MINIO_PUBLIC_SECURE")
    media_upload_max_bytes: int = Field(
        default=10 * 1024 * 1024,
        alias="MEDIA_UPLOAD_MAX_BYTES",
    )
    media_presign_ttl_seconds: int = Field(
        default=900,
        alias="MEDIA_PRESIGN_TTL_SECONDS",
    )

    def model_post_init(self, __context: object) -> None:
        if self.auth_mode == "dev" and self.app_env not in {"local", "test"}:
            raise ValueError("AUTH_MODE=dev is allowed only in local or test environments")

    @property
    def database_url(self) -> str:
        return (
            "postgresql+asyncpg://"
            f"{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_sync_url(self) -> str:
        return (
            "postgresql+psycopg://"
            f"{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/0"

    @property
    def s3_endpoint_url(self) -> str:
        scheme = "https" if self.minio_secure else "http"
        return f"{scheme}://{self.minio_endpoint}"

    @property
    def s3_public_endpoint_url(self) -> str:
        scheme = "https" if self.minio_public_secure else "http"
        return f"{scheme}://{self.minio_public_endpoint}"

    @property
    def admin_max_id_set(self) -> set[int]:
        if not self.admin_max_ids.strip():
            return set()
        try:
            return {
                int(value.strip())
                for value in self.admin_max_ids.split(",")
                if value.strip()
            }
        except ValueError as exc:
            raise ValueError("ADMIN_MAX_IDS must be a comma-separated list of integers") from exc


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
