from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, JSON
from sqlalchemy.sql import func

from app.db.session import Base


class ChatRequest(Base):
    __tablename__ = "chat_requests"

    id = Column(Integer, primary_key=True, index=True)

    request_id = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    visitor_id = Column(
        String(100),
        index=True,
        nullable=True,
    )

    conversation_id = Column(
        String(100),
        index=True,
        nullable=True,
    )

    message_id = Column(
        String(100),
        unique=True,
        index=True,
        nullable=True,
    )

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )

    user_query = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    response_length = Column(Integer, nullable=True)

    model_used = Column(String(100), nullable=True)
    streaming_enabled = Column(Boolean, default=False)
    reranking_enabled = Column(Boolean, default=True)

    frontend_source = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    screen_width = Column(Integer, nullable=True)
    screen_height = Column(Integer, nullable=True)

    total_latency_ms = Column(Float, nullable=True)
    retrieval_latency_ms = Column(Float, nullable=True)
    generation_latency_ms = Column(Float, nullable=True)
    backend_ttft_ms = Column(Float, nullable=True)

    status = Column(String(50), default="success", index=True)
    stream_cancelled = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)


class RetrievalLog(Base):
    __tablename__ = "retrieval_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(100), unique=True, index=True, nullable=False)

    user_query = Column(Text, nullable=False)

    # Retrieval mode
    used_forced_context = Column(Boolean, default=False)
    project_query = Column(Boolean, default=False)
    fallback_retrieval_used = Column(Boolean, default=False)
    reranking_enabled = Column(Boolean, default=True)

    # Chunk counts
    retrieved_chunks = Column(Integer, nullable=True)
    reranked_chunks = Column(Integer, nullable=True)

    # Timings
    vector_retrieval_duration_ms = Column(Float, nullable=True)
    fallback_retrieval_duration_ms = Column(Float, nullable=True)
    rerank_duration_ms = Column(Float, nullable=True)
    total_retrieval_duration_ms = Column(Float, nullable=True)

    # Chunk details
    retrieved_chunk_data = Column(JSON, nullable=True)
    reranked_chunk_data = Column(JSON, nullable=True)
    chunk_sources = Column(JSON, nullable=True)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )


class FrontendMetric(Base):
    __tablename__ = "frontend_metrics"

    id = Column(Integer, primary_key=True, index=True)

    request_id = Column(String(100), index=True, nullable=True)
    event_name = Column(String(100), nullable=False)

    chat_page_navigation_ms = Column(Float, nullable=True)
    time_to_first_token_ms = Column(Float, nullable=True)
    time_to_first_response_ms = Column(Float, nullable=True)
    stream_completion_ms = Column(Float, nullable=True)

    device_type = Column(String(50), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class ErrorLog(Base):
    __tablename__ = "error_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(100), index=True, nullable=True)

    error_type = Column(String(150), nullable=False)
    message = Column(Text, nullable=True)
    traceback = Column(Text, nullable=True)
    endpoint = Column(String(200), nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)