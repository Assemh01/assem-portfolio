def generate_chat_response(message: str) -> str:
    normalized = message.lower().strip()

    if "work authorization" in normalized:
        return (
            "Assem is based in Dearborn Heights, Michigan and is open to AI/ML roles. "
            "For exact work authorization details, it’s best to contact him directly."
        )

    if "projects" in normalized or "work" in normalized:
        return (
            "Assem has worked on production GenAI systems including RAG pipelines, "
            "LLM orchestration, AI tutoring platforms, natural-language-to-SQL systems, "
            "and applied AI proof-of-concepts across healthcare, legal, and customer service."
        )

    if "skills" in normalized:
        return (
            "Assem specializes in LLMs, RAG systems, backend APIs, vector search, "
            "LangChain, LangGraph, Milvus, Docker, AWS, and evaluation workflows like RAGAS."
        )

    return (
        "I can answer questions about Assem’s background, projects, AI engineering skills, "
        "resume, and portfolio work. Try asking about his RAG experience, projects, or tech stack."
    )