from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "EventForge"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    DISCORD_BOT_TOKEN: Optional[str] = None
    DISCORD_CLIENT_ID: Optional[str] = None

    DEFAULT_CHECK_IN_MINUTES: int = 30
    DATABASE_URL: str = "sqlite+aiosqlite:///./eventforge.db"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
