from typing import List, Dict, Any

from app.services.vector_store import retrieve_relevant_chunks


def retrieve_context(query: str, k: int = 6) -> str:
    chunks = retrieve_relevant_chunks(query=query, k=k)

    context_blocks = []

    for chunk in chunks:
        metadata = chunk["metadata"]

        context_blocks.append(
            f"""
Source: {metadata.get("source_file")}
Category: {metadata.get("category")}
Section: {metadata.get("section_title")}

{chunk["text"]}
""".strip()
        )

    return "\n\n---\n\n".join(context_blocks)


if __name__ == "__main__":
    test_queries = [
        "Does Assem need sponsorship?",
        "What kind of engineer is Assem?",
        "Has Assem worked with RAG?",
        "What projects has Assem built?",
        "Would Assem work onsite in Michigan?",
        "Tell me about Assem's Apple role.",
    ]

    for query in test_queries:
        print("\n==============================")
        print("QUERY:", query)
        print("==============================")
        print(retrieve_context(query, k=4)[:3000])