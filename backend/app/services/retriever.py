from typing import Any, Dict, List
from app.services.reranker import rerank_chunks
from app.services.vector_store import retrieve_relevant_chunks
import time

PROJECT_QUERY_TERMS = [
    "project",
    "projects",
    "built",
    "build",
    "worked on",
    "portfolio",
    "case study",
]


def is_project_query(query: str) -> bool:
    query_lower = query.lower()
    return any(term in query_lower for term in PROJECT_QUERY_TERMS)


def format_context_blocks(chunks: List[Dict[str, Any]]) -> str:
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

def is_broad_project_query(query: str) -> bool:
    q = query.lower()
    return (
        "what projects" in q
        or "projects has" in q
        or "worked on" in q
        or "what has assem built" in q
    )


def retrieve_context(query: str, k: int = 8) -> str:
    total_start = time.perf_counter()

    project_query = is_project_query(query)

    initial_k = 40 if project_query else 16

    vector_start = time.perf_counter()

    chunks = retrieve_relevant_chunks(
        query=query,
        k=initial_k,
    )

    vector_time = time.perf_counter() - vector_start

    if project_query:
        project_chunks = [
            chunk
            for chunk in chunks
            if chunk["metadata"].get("category") == "projects"
            or chunk["metadata"].get("source_file") == "projects.md"
        ]

        if len(project_chunks) >= 6:
            chunks = project_chunks
        else:
            fallback_start = time.perf_counter()

            chunks = retrieve_relevant_chunks(
                query="""
boxMind Flagship Platform
boxMind Academy
Financial Intelligence
Enterprise Knowledge
Speech AI
Document OCR
projects
""",
                k=24,
            )

            fallback_time = time.perf_counter() - fallback_start

            print(f"\nFallback Retrieval: {fallback_time:.2f}s")

            chunks = [
                chunk
                for chunk in chunks
                if chunk["metadata"].get("category") == "projects"
                or chunk["metadata"].get("source_file") == "projects.md"
            ]

    print("\nBEFORE RERANK:")
    for i, chunk in enumerate(chunks, 1):
        print(
            i,
            chunk["metadata"].get("section_title"),
            "distance:",
            chunk.get("distance"),
        )

    rerank_start = time.perf_counter()

    chunks = rerank_chunks(query, chunks, top_k=k)

    rerank_time = time.perf_counter() - rerank_start

    if is_broad_project_query(query):
        named_summary = [
            chunk
            for chunk in chunks
            if chunk["metadata"].get("section_title")
            == "Named Project Summary"
        ]

        others = [
            chunk
            for chunk in chunks
            if chunk["metadata"].get("section_title")
            != "Named Project Summary"
        ]

        chunks = named_summary + others

    print("\nAFTER RERANK:")
    for i, chunk in enumerate(chunks, 1):
        print(
            i,
            chunk["metadata"].get("section_title"),
            "score:",
            chunk.get("rerank_score"),
        )

    total_time = time.perf_counter() - total_start

    print("\n" + "-" * 80)
    print("RETRIEVAL METRICS")
    print(f"Vector Retrieval: {vector_time:.2f}s")
    print(f"Reranking: {rerank_time:.2f}s")
    print(f"Total Retrieval: {total_time:.2f}s")
    print("-" * 80 + "\n")

    return format_context_blocks(chunks)

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
        print(retrieve_context(query, k=8)[:4000])