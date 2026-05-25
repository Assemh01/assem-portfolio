from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.utils.error_notifier import send_error_notification
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.extension import _rate_limit_exceeded_handler

from app.schemas import ChatRequest, ChatResponse
from app.services.chat_service import (
    generate_chat_response,
    stream_chat_response,
)
from app.core.config import settings
from app.middleware.request_id import RequestIDMiddleware
from app.core.logger import logger


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,

    # Disable public API docs in production
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


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
    get_collection()
    _ = reranker
    logger.info("Embedding model, Chroma collection, and reranker preloaded.")

    
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
# Standard Chat Endpoint
# -----------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(request: Request, payload: ChatRequest):

    # Empty message protection
    if not payload.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # Length protection
    if len(payload.message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message too long.",
        )

    logger.info(
        f"[{request.state.request_id}] "
        f"Incoming /chat request "
        f"length={len(payload.message)}"
    )

    response = generate_chat_response(
        payload.message,
        payload.history,
        request_id=request.state.request_id,
    )

    return ChatResponse(response=response)


# -----------------------------------------------------------------------------
# Streaming Chat Endpoint
# -----------------------------------------------------------------------------

@app.post("/chat/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, payload: ChatRequest):
    # Empty message protection
    if not payload.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # Length protection
    if len(payload.message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message too long.",
        )

    logger.info(
        f"[{request.state.request_id}] "
        f"Incoming /chat/stream request "
        f"length={len(payload.message)}"
    )

    return StreamingResponse(
        stream_chat_response(
            payload.message,
            payload.history,
            request_id=request.state.request_id,
        ),
        media_type="text/plain",
    )
