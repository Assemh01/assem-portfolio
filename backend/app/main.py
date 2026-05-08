import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncio
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_response, stream_chat_response

load_dotenv()

app = FastAPI(
    title="Assem Portfolio Chatbot API",
    version="0.1.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
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
def chat(payload: ChatRequest):
    response = generate_chat_response(
        payload.message,
        payload.history
    )
    return ChatResponse(response=response)

@app.post("/chat/stream")
def chat_stream(payload: ChatRequest):
    return StreamingResponse(
        stream_chat_response(payload.message, payload.history),
        media_type="text/plain",
    )