import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncio
from fastapi.responses import StreamingResponse

from app.schemas import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_response

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


@app.post("/chat")
async def chat(payload: ChatRequest):
    response = generate_chat_response(payload.message)

    async def stream_response():
        words = response.split(" ")

        for word in words:
            yield word + " "
            await asyncio.sleep(0.08)

    return StreamingResponse(stream_response(), media_type="text/plain")