"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AttendanceOS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/attendanceos"
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # File Storage
    S3_BUCKET: str = "attendanceos-files"
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: Optional[str] = None  # For MinIO

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()