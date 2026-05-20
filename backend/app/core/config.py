from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Assem Portfolio API"
    APP_VERSION: str = "0.1.0"

    # Frontend
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # Models
    OPENAI_MODEL: str = "gpt-4o-mini"
    LOCAL_MODEL: str = "llama3.1:8b"
    RERANKER_MODEL: str = "BAAI/bge-reranker-base"
    EMBEDDING_MODEL: str = "BAAI/bge-base-en-v1.5"

    # Retrieval
    RETRIEVAL_K: int = 8
    INITIAL_RETRIEVAL_K: int = 16
    PROJECT_RETRIEVAL_K: int = 40

    # Paths
    CHROMA_DIR: str = "chroma_db"
    KNOWLEDGE_DIR: str = "knowledge_base"
    COLLECTION_NAME: str = "assem_portfolio_knowledge"

    # Debug
    DEBUG_RETRIEVAL: bool = True
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

    FALLBACK_PROJECT_RETRIEVAL_K: int = 24

@lru_cache
def get_settings():
    return Settings()


settings = get_settings()