from typing import Any, Dict, List
import time

from app.services.vector_store import retrieve_relevant_chunks
from app.services.reranker import rerank_chunks
from app.core.config import settings
from app.core.logger import logger
import re

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

    project_patterns = [
        r"\bproject\b",
        r"\bprojects\b",
        r"\bportfolio\b",
        r"\bcase study\b",
        r"\bcase studies\b",
        r"\bwhat has assem built\b",
        r"\bwhat did assem build\b",
        r"\bwhat has he built\b",
        r"\bwhat did he build\b",
        r"\bprojects? (has|did) assem\b",
    ]

    return any(
        re.search(pattern, query_lower)
        for pattern in project_patterns
    )


def format_context_blocks(chunks: List[Dict[str, Any]]) -> str:
    context_blocks = []

    for chunk in chunks:
        context_blocks.append(
            chunk["text"].strip()
        )

    return "\n\n".join(context_blocks)

def serialize_chunk(
    chunk: Dict[str, Any],
    *,
    original_rank: int | None = None,
    final_rank: int | None = None,
) -> Dict[str, Any]:
    metadata = chunk.get("metadata") or {}

    return {
        "original_rank": original_rank,
        "final_rank": final_rank,
        "source_file": metadata.get("source_file"),
        "category": metadata.get("category"),
        "section_title": metadata.get("section_title"),
        "distance": chunk.get("distance"),
        "rerank_score": chunk.get("rerank_score"),
        # Avoid storing entire KB chunks unnecessarily.
        "text_preview": chunk.get("text", "")[:1000],
        "metadata": metadata,
    }

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
) -> tuple[str, Dict[str, Any]]:
    total_start = time.perf_counter()

    project_query = is_project_query(query)
    fallback_retrieval_used = False
    fallback_time = 0.0

    initial_k = (
        settings.PROJECT_RETRIEVAL_K
        if project_query
        else settings.INITIAL_RETRIEVAL_K
    )

    # -------------------------------------------------------------------------
    # Vector retrieval
    # -------------------------------------------------------------------------

    vector_start = time.perf_counter()

    chunks = retrieve_relevant_chunks(
        query=query,
        k=initial_k,
        request_id=request_id,
    )

    # Deduplicate overlapping chunks.
    deduped_chunks = []
    seen_texts = set()

    for chunk in chunks:
        text_key = chunk.get("text", "")[:200].strip()

        if not text_key or text_key in seen_texts:
            continue

        seen_texts.add(text_key)
        deduped_chunks.append(chunk)

    chunks = deduped_chunks

    vector_time = time.perf_counter() - vector_start

    # -------------------------------------------------------------------------
    # Project-specific filtering and fallback
    # -------------------------------------------------------------------------

    if project_query:
        project_chunks = [
            chunk
            for chunk in chunks
            if (
                chunk.get("metadata", {}).get("category")
                == "projects"
                or chunk.get("metadata", {}).get("source_file")
                == "projects.md"
            )
        ]

        if len(project_chunks) >= 6:
            chunks = project_chunks

        else:
            fallback_retrieval_used = True
            fallback_start = time.perf_counter()

            fallback_chunks = retrieve_relevant_chunks(
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
                request_id=request_id,
            )

            fallback_time = (
                time.perf_counter() - fallback_start
            )

            logger.info(
                f"[{request_id}] Fallback Retrieval: "
                f"{fallback_time:.2f}s"
            )

            chunks = [
                chunk
                for chunk in fallback_chunks
                if (
                    chunk.get("metadata", {}).get("category")
                    == "projects"
                    or chunk.get("metadata", {}).get(
                        "source_file"
                    )
                    == "projects.md"
                )
            ]

            # Deduplicate fallback results too.
            deduped_fallback_chunks = []
            seen_fallback_texts = set()

            for chunk in chunks:
                text_key = (
                    chunk.get("text", "")[:200].strip()
                )

                if (
                    not text_key
                    or text_key in seen_fallback_texts
                ):
                    continue

                seen_fallback_texts.add(text_key)
                deduped_fallback_chunks.append(chunk)

            chunks = deduped_fallback_chunks

    # Capture the exact candidates supplied to the reranker.
    original_rank_by_text = {}

    for rank, chunk in enumerate(chunks, start=1):
        text_key = chunk.get("text", "")
        original_rank_by_text[text_key] = rank

    retrieved_chunk_data = [
        serialize_chunk(
            chunk,
            original_rank=rank,
        )
        for rank, chunk in enumerate(chunks, start=1)
    ]

    retrieved_count = len(chunks)

    # -------------------------------------------------------------------------
    # Debug output before reranking
    # -------------------------------------------------------------------------

    if settings.DEBUG_RETRIEVAL:
        logger.info(f"[{request_id}] BEFORE RERANK")

        for i, chunk in enumerate(chunks, 1):
            metadata = chunk.get("metadata") or {}

            logger.info(
                f"[{request_id}] {i} | "
                f"{metadata.get('section_title')} | "
                f"distance: {chunk.get('distance')}"
            )

    # -------------------------------------------------------------------------
    # Reranking
    # -------------------------------------------------------------------------

    rerank_start = time.perf_counter()

    chunks = rerank_chunks(
        query=query,
        chunks=chunks,
        top_k=k,
    )

    rerank_time = time.perf_counter() - rerank_start

    # Preserve your broad-project answer ordering.
    if is_broad_project_query(query):
        named_summary = [
            chunk
            for chunk in chunks
            if (
                chunk.get("metadata", {}).get("section_title")
                == "Named Project Summary"
            )
        ]

        others = [
            chunk
            for chunk in chunks
            if (
                chunk.get("metadata", {}).get("section_title")
                != "Named Project Summary"
            )
        ]

        chunks = named_summary + others

    reranked_chunk_data = []

    for final_rank, chunk in enumerate(chunks, start=1):
        text_key = chunk.get("text", "")

        reranked_chunk_data.append(
            serialize_chunk(
                chunk,
                original_rank=original_rank_by_text.get(
                    text_key
                ),
                final_rank=final_rank,
            )
        )

    # Create a simple unique list for dashboard grouping.
    chunk_sources = list(
        dict.fromkeys(
            chunk_data.get("source_file")
            for chunk_data in reranked_chunk_data
            if chunk_data.get("source_file")
        )
    )

    # -------------------------------------------------------------------------
    # Logging
    # -------------------------------------------------------------------------

    logger.info(f"[{request_id}] AFTER RERANK")

    for i, chunk in enumerate(chunks, 1):
        metadata = chunk.get("metadata") or {}

        logger.info(
            f"[{request_id}] {i} | "
            f"{metadata.get('section_title')} | "
            f"score: {chunk.get('rerank_score')}"
        )

    total_time = time.perf_counter() - total_start

    logger.info(f"[{request_id}] " + "-" * 80)
    logger.info(f"[{request_id}] RETRIEVAL METRICS")
    logger.info(
        f"[{request_id}] Vector Retrieval: "
        f"{vector_time:.2f}s"
    )
    logger.info(
        f"[{request_id}] Fallback Retrieval: "
        f"{fallback_time:.2f}s"
    )
    logger.info(
        f"[{request_id}] Reranking: "
        f"{rerank_time:.2f}s"
    )
    logger.info(
        f"[{request_id}] Total Retrieval: "
        f"{total_time:.2f}s"
    )
    logger.info(f"[{request_id}] " + "-" * 80)

    retrieval_metrics = {
        "used_forced_context": False,
        "project_query": project_query,
        "fallback_retrieval_used": fallback_retrieval_used,
        "reranking_enabled": True,
        "retrieved_chunks": retrieved_count,
        "reranked_chunks": len(chunks),
        "vector_retrieval_duration_ms": vector_time * 1000,
        "fallback_retrieval_duration_ms": (
            fallback_time * 1000
        ),
        "rerank_duration_ms": rerank_time * 1000,
        "total_retrieval_duration_ms": total_time * 1000,
        "retrieved_chunk_data": retrieved_chunk_data,
        "reranked_chunk_data": reranked_chunk_data,
        "chunk_sources": chunk_sources,
    }

    return format_context_blocks(chunks), retrieval_metrics

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

        context, metrics = retrieve_context(
            query,
            k=8,
            request_id="manual-test",
        )

        logger.info(context[:4000])
        logger.info(metrics)