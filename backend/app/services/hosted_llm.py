from openai import OpenAI
from dotenv import load_dotenv
from app.core.config import settings
from app.prompts.system_prompt import SYSTEM_PROMPT

load_dotenv()
client = OpenAI(api_key=settings.OPENAI_API_KEY)

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

SHORT_FACTUAL_PATTERNS = [
    "sponsorship",
    "work authorization",
    "authorized to work",
    "green card",
    "visa",
    "located",
    "location",
    "where is",
    "years of experience",
    "current role",
    "based in",
    "remote",
    "onsite",
]

TECHNICAL_PATTERNS = [
    "architecture",
    "rag",
    "retrieval",
    "reranking",
    "evaluation",
    "langchain",
    "langgraph",
    "deployment",
    "vector db",
    "vector database",
    "embedding",
    "pipeline",
    "orchestration",
    "infrastructure",
    "scaling",
    "fastapi",
    "latency",
    "streaming",
    "observability",
    "analytics",
    "backend",
]

def classify_query(question: str) -> str:
    q = question.lower()

    if any(pattern in q for pattern in SHORT_FACTUAL_PATTERNS):
        return "short_factual"

    if any(pattern in q for pattern in TECHNICAL_PATTERNS):
        return "technical"

    return "general"

def build_dynamic_instruction(question_type: str) -> str:

    if question_type == "short_factual":
        return """
            Answer directly and briefly.

            Do:
            - answer immediately
            - keep responses concise
            - use at most 1 short paragraph
            - avoid follow-up commentary
            - avoid extra explanation
            - avoid generic professional advice
            - avoid elaborating unless necessary

            These responses should feel recruiter-friendly and efficient.
            """.strip()
    if question_type == "technical":
        return """
            Provide a deeper engineering explanation.

            Focus on:
            - architecture
            - system design
            - retrieval/orchestration flow
            - infrastructure decisions
            - tradeoffs
            - deployment considerations
            - practical engineering reasoning

            Avoid:
            - generic summaries
            - shallow tool listings
            - resume-style phrasing

            Assume the user is technically literate.
            """.strip()
    return """
        Provide a balanced response with moderate depth.

        Answer directly first, then elaborate naturally if useful.
        """.strip()

def generate_with_hosted_llm(question: str, context: str, history=None):
    history = history or []
    question_type = classify_query(question)
    dynamic_instruction = build_dynamic_instruction(question_type)

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
        Relevant Information:
        {context}

        User Question:
        {question}

        Response Style Instructions:
        {dynamic_instruction}
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
    question_type = classify_query(question)
    dynamic_instruction = build_dynamic_instruction(question_type)
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
        Relevant Information:
        {context}

        User Question:
        {question}

        Response Style Instructions:
        {dynamic_instruction}
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

