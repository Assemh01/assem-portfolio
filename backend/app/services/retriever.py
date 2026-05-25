from typing import Any, Dict, List
from app.services.vector_store import retrieve_relevant_chunks
import time
from app.core.config import settings
from app.core.logger import logger

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


def retrieve_context(
        query: str,
        k: int = settings.RETRIEVAL_K,
        request_id: str = "unknown",
    ) -> str:
    
    total_start = time.perf_counter()

    project_query = is_project_query(query)

    initial_k = (
        settings.PROJECT_RETRIEVAL_K
        if project_query
        else settings.INITIAL_RETRIEVAL_K
    )

    vector_start = time.perf_counter()

    chunks = retrieve_relevant_chunks(
        query=query,
        k=initial_k,
        request_id=request_id,
    )
    # Deduplicate overlapping chunks
    deduped_chunks = []
    seen_texts = set()

    for chunk in chunks:
        text_key = chunk["text"][:200].strip()

        if text_key in seen_texts:
            continue

        seen_texts.add(text_key)
        deduped_chunks.append(chunk)

    chunks = deduped_chunks

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
                k=settings.FALLBACK_PROJECT_RETRIEVAL_K,
            )

            fallback_time = time.perf_counter() - fallback_start

            logger.info(
                f"[{request_id}] Fallback Retrieval: {fallback_time:.2f}s"
            )

            chunks = [
                chunk
                for chunk in chunks
                if chunk["metadata"].get("category") == "projects"
                or chunk["metadata"].get("source_file") == "projects.md"
            ]

    if settings.DEBUG_RETRIEVAL:
        logger.info(f"[{request_id}] BEFORE RERANK")

        for i, chunk in enumerate(chunks, 1):
            logger.info(
                f"[{request_id}] {i} | "
                f"{chunk['metadata'].get('section_title')} | "
                f"distance: {chunk.get('distance')}"
            )

    rerank_start = time.perf_counter()

    chunks = chunks[:k]

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

    logger.info(f"[{request_id}] AFTER RERANK")
    for i, chunk in enumerate(chunks, 1):
        logger.info(
            f"[{request_id}] {i} | "
            f"{chunk['metadata'].get('section_title')} | "
            f"score: {chunk.get('rerank_score')}"
        )

    total_time = time.perf_counter() - total_start

    logger.info(f"[{request_id}] " + "-" * 80)
    logger.info(f"[{request_id}] RETRIEVAL METRICS")
    logger.info(f"[{request_id}] Vector Retrieval: {vector_time:.2f}s")
    logger.info(f"[{request_id}] Reranking: {rerank_time:.2f}s")
    logger.info(f"[{request_id}] Total Retrieval: {total_time:.2f}s")
    logger.info(f"[{request_id}] " + "-" * 80)

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
        logger.info("=" * 30)
        logger.info(f"QUERY: {query}")
        logger.info("=" * 30)
        logger.info(retrieve_context(query, k=8, request_id="manual-test")[:4000])