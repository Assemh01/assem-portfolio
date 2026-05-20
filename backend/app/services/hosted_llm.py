from openai import OpenAI
from dotenv import load_dotenv
from app.core.config import settings
from app.prompts import system_prompt

load_dotenv()
client = OpenAI()

MODEL_NAME = settings.OPENAI_MODEL

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


SYSTEM_PROMPT = system_prompt


def generate_with_hosted_llm(question: str, context: str, history=None):
    history = history or []

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    for msg in history[-6:]:
        normalized = _normalize_history_message(msg)

        if (
            normalized["role"] in {"user", "assistant"}
            and normalized["content"].strip()
        ):
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

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=0.15,
    )

    return response.choices[0].message.content

def stream_with_hosted_llm(question: str, context: str, history=None):
    history = history or []

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    for msg in history[-6:]:
        normalized = _normalize_history_message(msg)

        if (
            normalized["role"] in {"user", "assistant"}
            and normalized["content"].strip()
        ):
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

    stream = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=0.15,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content

        if delta:
            yield delta