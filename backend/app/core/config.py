from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
from pydantic import field_validator

class Settings(BaseSettings):
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # Environment
    APP_ENV: str = "development"

    # API Keys
    OPENAI_API_KEY: str

    #Enable Reranker
    ENABLE_RERANKING: bool = True

    #Database
    DATABASE_URL: str

    # App
    APP_NAME: str = "Assem Portfolio API"
    APP_VERSION: str = "0.1.0"

    # Frontend
    ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
]

    # Models
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Admin authentication
    ADMIN_KEY: str

    LOCAL_MODEL: str = "llama3.1:8b"
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # Retrieval
    RETRIEVAL_K: int = 5
    INITIAL_RETRIEVAL_K: int = 8
    PROJECT_RETRIEVAL_K: int = 20
    FALLBACK_PROJECT_RETRIEVAL_K: int = 12

    # Paths
    CHROMA_DIR: str = "chroma_db"
    KNOWLEDGE_DIR: str = "knowledge_base"
    COLLECTION_NAME: str = "assem_portfolio_knowledge"

    #Telegram Alerts
    TELEGRAM_BOT_TOKEN: str | None = None
    TELEGRAM_CHAT_ID: str | None = None

    # Debug
    DEBUG_RETRIEVAL: bool = True
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()