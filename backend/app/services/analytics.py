from typing import Any

from sqlalchemy.orm import Session
import traceback
from app.core.logger import logger
from app.db.models import (
    ChatRequest,
    ErrorLog,
    FrontendMetric,
    RetrievalLog,
)

def log_chat_request(db: Session, **kwargs: Any) -> None:
    db.add(ChatRequest(**kwargs))
    db.commit()

def log_frontend_metric(
    db: Session,
    *,
    event_name: str,
    request_id: str | None = None,
    chat_page_navigation_ms: float | None = None,
    time_to_first_token_ms: float | None = None,
    time_to_first_response_ms: float | None = None,
    stream_completion_ms: float | None = None,
    device_type: str | None = None,
    metadata_json: dict[str, Any] | None = None,
) -> None:
    try:
        metric = FrontendMetric(
            request_id=request_id,
            event_name=event_name,
            chat_page_navigation_ms=chat_page_navigation_ms,
            time_to_first_token_ms=time_to_first_token_ms,
            time_to_first_response_ms=time_to_first_response_ms,
            stream_completion_ms=stream_completion_ms,
            device_type=device_type,
            metadata_json=metadata_json,
        )

        db.add(metric)
        db.commit()

    except Exception:
        db.rollback()

        logger.exception(
            f"[{request_id}] Failed to save frontend metric"
        )

        raise


def log_error(
    db: Session,
    error: Exception,
    request_id: str | None = None,
    endpoint: str | None = None,
) -> None:
    db.add(
        ErrorLog(
            request_id=request_id,
            error_type=type(error).__name__,
            message=str(error),
            traceback=traceback.format_exc(),
            endpoint=endpoint,
        )
    )
    db.commit()

def log_retrieval(
    db: Session,
    *,
    request_id: str,
    user_query: str,
    metrics: dict[str, Any],
) -> None:
    try:
        retrieval_log = RetrievalLog(
            request_id=request_id,
            user_query=user_query,
            used_forced_context=metrics.get(
                "used_forced_context",
                False,
            ),
            project_query=metrics.get(
                "project_query",
                False,
            ),
            fallback_retrieval_used=metrics.get(
                "fallback_retrieval_used",
                False,
            ),
            reranking_enabled=metrics.get(
                "reranking_enabled",
                False,
            ),
            retrieved_chunks=metrics.get(
                "retrieved_chunks",
            ),
            reranked_chunks=metrics.get(
                "reranked_chunks",
            ),
            vector_retrieval_duration_ms=metrics.get(
                "vector_retrieval_duration_ms",
            ),
            fallback_retrieval_duration_ms=metrics.get(
                "fallback_retrieval_duration_ms",
            ),
            rerank_duration_ms=metrics.get(
                "rerank_duration_ms",
            ),
            total_retrieval_duration_ms=metrics.get(
                "total_retrieval_duration_ms",
            ),
            retrieved_chunk_data=metrics.get(
                "retrieved_chunk_data",
            ),
            reranked_chunk_data=metrics.get(
                "reranked_chunk_data",
            ),
            chunk_sources=metrics.get(
                "chunk_sources",
            ),
        )

        db.add(retrieval_log)
        db.commit()

    except Exception:
        db.rollback()

        logger.exception(
            f"[{request_id}] Failed to save retrieval analytics"
        )