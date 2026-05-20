import ollama
from app.core.config import settings
from app.prompts import system_prompt

MODEL_NAME = settings.LOCAL_MODEL

SYSTEM_PROMPT = system_prompt


def _normalize_history_message(msg):
    if isinstance(msg, dict):
        return {
            "role": msg.get("role", "user"),
            "content": msg.get("content", ""),
        }

    return {
        "role": getattr(msg, "role", "user"),
        "content": getattr(msg, "content", ""),
    }


def generate_with_local_llm(question: str, context: str, history=None) -> str:
    history = history or []

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    for msg in history[-6:]:
        normalized = _normalize_history_message(msg)

        if normalized["role"] in {"user", "assistant"} and normalized["content"].strip():
            messages.append(normalized)

    messages.append(
        {
            "role": "user",
            "content": f"""
Context:
{context}

Question:
{question}
""".strip(),
        }
    )

    response = ollama.chat(
        model=MODEL_NAME,
        messages=messages,
        options={
            "temperature": 0.15,
            "num_gpu": 0,
        },
    )

    return response["message"]["content"]

def stream_with_local_llm(question: str, context: str, history=None):
    history = history or []

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    for msg in history[-6:]:
        normalized = _normalize_history_message(msg)

        if normalized["role"] in {"user", "assistant"} and normalized["content"].strip():
            messages.append(normalized)

    messages.append({
        "role": "user",
        "content": f"""
Context:
{context}

Question:
{question}
""".strip(),
    })

    stream = ollama.chat(
        model=MODEL_NAME,
        messages=messages,
        stream=True,
        options={
            "temperature": 0.15,
            "num_gpu": 0,
        },
    )

    for chunk in stream:
        content = chunk.get("message", {}).get("content", "")
        if content:
            yield content