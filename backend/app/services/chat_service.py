from app.services.retriever import retrieve_context
from app.services.local_llm import generate_with_local_llm, stream_with_local_llm


def generate_chat_response(message: str, history=None) -> str:
    context = retrieve_context(message, k=5)
    return generate_with_local_llm(message, context, history)


def stream_chat_response(message: str, history=None):
    context = retrieve_context(message, k=5)
    yield from stream_with_local_llm(message, context, history)