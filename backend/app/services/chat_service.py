from app.services.retriever import retrieve_context


def generate_chat_response(message: str) -> str:
    context = retrieve_context(message, k=5)

    return f"""
I found relevant context for this question.

Question:
{message}

Retrieved context:
{context[:2500]}
""".strip()