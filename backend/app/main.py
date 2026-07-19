from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.utils.error_notifier import send_error_notification
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.extension import _rate_limit_exceeded_handler
from app.db.init_db import init_db
from app.schemas import ChatRequest, ChatResponse
from app.services.chat_service import (
    generate_chat_response,
    stream_chat_response,
)
from app.core.config import settings
from app.middleware.request_id import RequestIDMiddleware
from app.core.logger import logger
import time
from sqlalchemy.orm import Session
from app.services.analytics import log_chat_request, log_error, log_frontend_metric, log_retrieval
from app.db.session import get_db, SessionLocal
from app.schemas import (
    ChatRequest,
    ChatResponse,
    FrontendAnalyticsEvent,
)
from app.routers.admin import router as admin_router


init_db()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,

    # Disable public API docs in production
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.include_router(admin_router)

ALLOWED_FRONTEND_EVENTS = {
    "homepage_loaded",
    "chat_opened",
    "chat_initialized",
    "message_sent",
    "first_token_received",
    "stream_completed",
    "stream_cancelled",
    "stream_failed",
}

# -----------------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------------

app.add_middleware(RequestIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
logger.info(
    f"Allowed CORS origins: {settings.ALLOWED_ORIGINS}"
)
# -----------------------------------------------------------------------------
# Rate Limiting
# -----------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

app.add_middleware(SlowAPIMiddleware)

from app.services.vector_store import get_collection
from app.services.reranker import reranker

@app.on_event("startup")
def preload_models():
    collection = get_collection()
    logger.info(f"Collection count: {collection.count()}")
    logger.info("Chroma collection ready.")

@app.middleware("http")
async def global_exception_handler(request: Request, call_next):

    try:
        response = await call_next(request)
        return response

    except Exception as e:

        request_id = getattr(
            request.state,
            "request_id",
            "unknown",
        )

        error_message = f"""
🚨 Portfolio Backend Error

Endpoint: {request.url.path}

Method: {request.method}

Request ID: {request_id}

Error:
{str(e)}
"""

        logger.exception(
            f"[{request_id}] Unhandled exception"
        )

        send_error_notification(error_message)

        raise e
    

# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "portfolio-chatbot-api",
    }

# -----------------------------------------------------------------------------
# Frontend Analytics
# -----------------------------------------------------------------------------

@app.post("/client-metrics", status_code=204)
@limiter.limit("60/minute")
async def analytics_event(
    request: Request,
    payload: FrontendAnalyticsEvent,
    db: Session = Depends(get_db),
):
    if payload.event_name not in ALLOWED_FRONTEND_EVENTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported analytics event.",
        )

    request_id = payload.request_id

    try:
        log_frontend_metric(
            db,
            request_id=request_id,
            event_name=payload.event_name,
            chat_page_navigation_ms=(
                payload.chat_page_navigation_ms
            ),
            time_to_first_token_ms=(
                payload.time_to_first_token_ms
            ),
            time_to_first_response_ms=(
                payload.time_to_first_response_ms
            ),
            stream_completion_ms=(
                payload.stream_completion_ms
            ),
            device_type=payload.device_type,
            metadata_json=payload.metadata,
        )

    except Exception as exc:
        logger.exception(
            f"[{request_id}] Failed to save frontend event "
            f"{payload.event_name}"
        )

        log_error(
            db,
            exc,
            request_id=request_id,
            endpoint="/client-metrics",
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to save analytics event.",
        )

    return None

# -----------------------------------------------------------------------------
# Standard Chat Endpoint
# -----------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    start_time = time.perf_counter()
    request_id = request.state.request_id

    response = ""
    status = "success"
    error_message = None
    metrics = {}

    def save_retrieval_metrics(
        retrieval_metrics: dict,
    ) -> None:
        log_retrieval(
            db,
            request_id=request_id,
            user_query=payload.message,
            metrics=retrieval_metrics,
        )
    
    try:
        if not payload.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty.",
            )

        if len(payload.message) > 2000:
            raise HTTPException(
                status_code=400,
                detail="Message too long.",
            )

        logger.info(
            f"[{request_id}] Incoming /chat request "
            f"length={len(payload.message)}"
        )

        response, metrics = generate_chat_response(
            payload.message,
            payload.history,
            request_id=request_id,
            on_retrieval_complete=save_retrieval_metrics,
        )
        return ChatResponse(response=response)

    except Exception as e:
        status = "error"
        error_message = str(e)

        log_error(
            db,
            e,
            request_id=request_id,
            endpoint="/chat",
        )

        raise

    finally:
        total_latency_ms = (time.perf_counter() - start_time) * 1000
        log_chat_request(
            db,
            request_id=request_id,
            visitor_id=payload.visitor_id,
            conversation_id=payload.conversation_id,
            message_id=payload.message_id,
            user_query=payload.message,
            response_text=response or None,
            response_length=len(response) if response else None,
            model_used=settings.OPENAI_MODEL,
            streaming_enabled=False,
            reranking_enabled=metrics.get(
                "retrieval_metrics",
                {},
            ).get(
                "reranking_enabled",
                False,
            ),
            frontend_source="portfolio_chat",
            device_type=payload.device_type,
            browser=payload.browser,
            screen_width=payload.screen_width,
            screen_height=payload.screen_height,
            total_latency_ms=total_latency_ms,
            retrieval_latency_ms=metrics.get(
                "retrieval_latency_ms"
            ),
            generation_latency_ms=metrics.get(
                "generation_latency_ms"
            ),
            backend_ttft_ms=None,
            status=status,
            stream_cancelled=False,
            error_message=error_message,
        )

# -----------------------------------------------------------------------------
# Streaming Chat Endpoint
# -----------------------------------------------------------------------------

@app.post("/chat/stream")
@limiter.limit("20/minute")
async def chat_stream(
    request: Request,
    payload: ChatRequest,
):
    request_id = request.state.request_id
    request_start = time.perf_counter()

    def save_stream_retrieval_metrics(
            retrieval_metrics: dict,
        ) -> None:
            retrieval_db = SessionLocal()

            try:
                log_retrieval(
                    retrieval_db,
                    request_id=request_id,
                    user_query=payload.message,
                    metrics=retrieval_metrics,
                )
            finally:
                retrieval_db.close()
    try:
        if not payload.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty.",
            )

        if len(payload.message) > 2000:
            raise HTTPException(
                status_code=400,
                detail="Message too long.",
            )

        logger.info(
            f"[{request_id}] Incoming /chat/stream request "
            f"length={len(payload.message)}"
        )

        def save_stream_metrics(metrics: dict) -> None:
            db = SessionLocal()

            try:
                log_chat_request(
                    db,
                    request_id=request_id,
                    visitor_id=payload.visitor_id,
                    conversation_id=payload.conversation_id,
                    message_id=payload.message_id,
                    user_query=payload.message,
                    response_text=metrics.get("response_text"),
                    response_length=metrics["response_length"],
                    model_used=settings.OPENAI_MODEL,
                    streaming_enabled=True,
                    reranking_enabled=metrics.get(
                        "reranking_enabled",
                        False,
                    ),
                    frontend_source="portfolio_chat",
                    device_type=payload.device_type,
                    browser=payload.browser,
                    screen_width=payload.screen_width,
                    screen_height=payload.screen_height,
                    total_latency_ms=metrics["total_latency_ms"],
                    retrieval_latency_ms=metrics[
                        "retrieval_latency_ms"
                    ],
                    generation_latency_ms=metrics[
                        "generation_latency_ms"
                    ],
                    backend_ttft_ms=metrics.get(
                        "time_to_first_token_ms"
                    ),
                    status=metrics["status"],
                    stream_cancelled=metrics.get(
                        "stream_cancelled",
                        False,
                    ),
                    error_message=metrics["error_message"],
                )

                log_frontend_metric(
                    db,
                    request_id=request_id,
                    event_name=f"stream_{metrics['status']}",
                    time_to_first_token_ms=metrics.get(
                        "time_to_first_token_ms"
                    ),
                    stream_completion_ms=metrics.get(
                        "total_latency_ms"
                    ),
                )

                if metrics["status"] == "error":
                    stream_error = RuntimeError(
                        metrics["error_message"]
                        or "Unknown streaming error"
                    )

                    log_error(
                        db,
                        stream_error,
                        request_id=request_id,
                        endpoint="/chat/stream",
                    )

            finally:
                db.close()

        return StreamingResponse(
            stream_chat_response(
                payload.message,
                payload.history,
                request_id=request_id,
                on_complete=save_stream_metrics,
                on_retrieval_complete=(
                    save_stream_retrieval_metrics
                ),
            ),
            media_type="text/plain",
        )

    except Exception as exc:
        total_latency_ms = (
            time.perf_counter() - request_start
        ) * 1000

        error_message = (
            str(exc.detail)
            if isinstance(exc, HTTPException)
            else str(exc)
        )

        db = SessionLocal()

        try:
            log_chat_request(
                db,
                request_id=request_id,
                visitor_id=payload.visitor_id,
                conversation_id=payload.conversation_id,
                message_id=payload.message_id,
                user_query=payload.message,
                response_text=None,
                response_length=None,
                model_used=settings.OPENAI_MODEL,
                streaming_enabled=True,
                reranking_enabled=False,
                frontend_source="portfolio_chat",
                device_type=payload.device_type,
                browser=payload.browser,
                screen_width=payload.screen_width,
                screen_height=payload.screen_height,
                total_latency_ms=total_latency_ms,
                retrieval_latency_ms=None,
                generation_latency_ms=None,
                backend_ttft_ms=None,
                status="error",
                stream_cancelled=False,
                error_message=error_message,
            )
            log_error(
                db,
                exc,
                request_id=request_id,
                endpoint="/chat/stream",
            )

        finally:
            db.close()

        raise