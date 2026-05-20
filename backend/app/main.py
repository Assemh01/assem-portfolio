from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_response, stream_chat_response
from app.core.config import settings
from app.middleware.request_id import RequestIDMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.add_middleware(RequestIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "portfolio-chatbot-api",
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: Request, payload: ChatRequest):
    response = generate_chat_response(
    payload.message,
    payload.history,
    request_id=request.state.request_id,
)  
    return ChatResponse(response=response)

@app.post("/chat/stream")
def chat_stream(request: Request, payload: ChatRequest):
    return StreamingResponse(
        stream_chat_response(
        payload.message,
        payload.history,
        request_id=request.state.request_id,
    ),
    media_type="text/plain",
)