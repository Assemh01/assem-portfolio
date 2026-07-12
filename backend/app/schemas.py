from pydantic import BaseModel, Field
from typing import List, Optional, Any

class ChatMessage(BaseModel):
    role: str = Field(..., examples=["user", "assistant"])
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    response: str

class FrontendAnalyticsEvent(BaseModel):
    event_name: str = Field(
        min_length=1,
        max_length=100,
    )

    request_id: str | None = Field(
        default=None,
        max_length=100,
    )

    chat_page_navigation_ms: float | None = Field(
        default=None,
        ge=0,
    )

    time_to_first_token_ms: float | None = Field(
        default=None,
        ge=0,
    )

    time_to_first_response_ms: float | None = Field(
        default=None,
        ge=0,
    )

    stream_completion_ms: float | None = Field(
        default=None,
        ge=0,
    )

    device_type: str | None = Field(
        default=None,
        max_length=50,
    )

    metadata: dict[str, Any] | None = None