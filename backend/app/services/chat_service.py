from app.services.retriever import retrieve_context
from app.services.local_llm import generate_with_local_llm, stream_with_local_llm
from app.services.hosted_llm import generate_with_hosted_llm, stream_with_hosted_llm
import time
from app.core.config import settings
from app.core.logger import logger
from typing import Any, Callable

def debug_print(
        message: str,
        context: str,
        request_id: str = "unknown",
    ):
    if not settings.DEBUG_RETRIEVAL:
        return

    logger.info(f"[{request_id}] " + "=" * 80)
    logger.info(f"[{request_id}] QUESTION: {message}")
    logger.info(f"[{request_id}] RETRIEVED CONTEXT:")
    logger.info(f"[{request_id}] {context[:4000]}")
    logger.info(f"[{request_id}] " + "=" * 80)


def generate_chat_response(
    message: str,
    history=None,
    request_id: str = "unknown",
    on_retrieval_complete: Callable[[dict[str, Any]], None] | None = None,
) -> tuple[str, dict[str, Any]]:
    
    total_start = time.perf_counter()

    retrieval_start = time.perf_counter()

    normalized = message.lower().strip()

    forced_context = None

    if "years of experience" in normalized:
        forced_context = (
            "FACTS: Assem has around 2+ years of hands-on AI engineering "
            "experience spanning production AI systems, retrieval infrastructure, "
            "backend development, evaluation workflows, and applied generative AI products. "
            "His experience includes production work at boxMind.ai, AI evaluation "
            "work through Apple via Inspyr Solutions, internship experience in "
            "computer vision/OCR systems, and independent freelance and personal "
            "engineering projects."
        )

    elif (
        "salary" in normalized
        or "compensation" in normalized
        or "pay expectation" in normalized
        or "salary expectation" in normalized
        or "expected salary" in normalized
        or "salary range" in normalized
    ):
        forced_context = (
            "FACTS: Compensation depends on the role, scope, and overall opportunity. "
            "Assem is open to discussing compensation details directly during the interview process."
        )

    elif (
        "sponsorship" in normalized
        or "work authorization" in normalized
        or "authorized to work" in normalized
        or "green card" in normalized
        or "visa" in normalized
    ):
        forced_context = (
            "FACTS: Assem is fully authorized to work in the United States as a lawful "
            "permanent resident (Green Card holder) and does not require sponsorship."
        )
    elif (
        "contact" in normalized
        or "reach assem" in normalized
        or "get in touch" in normalized
        or "email" in normalized
        or "linkedin" in normalized
        or "phone" in normalized
        or "call" in normalized
    ):
        forced_context = (
            "FACTS: Visitors can contact Assem directly through LinkedIn, email, or phone. "
            "LinkedIn: [Assem Alhomsi](https://www.linkedin.com/in/assem-alhomsi-bbb87b23a). "
            "Email: [assem.h2001@gmail.com](mailto:assem.h2001@gmail.com). "
            "GitHub: [Assemh01](https://github.com/Assemh01) "
            "Phone: [+1 (313) 247-0367](tel:+13132470367). "
            "Keep the answer concise and provide the links directly."
        )

    if forced_context:
        context = forced_context
        retrieval_metrics = build_forced_context_metrics()
    else:
        context, retrieval_metrics = retrieve_context(
            message,
            k=settings.RETRIEVAL_K,
            request_id=request_id,
        )

    retrieval_time = time.perf_counter() - retrieval_start

    # Include the complete service-level retrieval measurement.
    retrieval_metrics["total_retrieval_duration_ms"] = (
        retrieval_time * 1000
    )

    if on_retrieval_complete is not None:
        try:
            on_retrieval_complete(retrieval_metrics)
        except Exception:
            logger.exception(
                f"[{request_id}] Failed to save retrieval analytics"
            )
    debug_print(message, context, request_id)

    generation_start = time.perf_counter()
    response = generate_with_hosted_llm(message, context, history)
    generation_time = time.perf_counter() - generation_start

    total_time = time.perf_counter() - total_start

    logger.info(f"[{request_id}] " + "=" * 80)
    logger.info(f"[{request_id}] LATENCY")
    logger.info(f"[{request_id}] Retrieval: {retrieval_time:.2f}s")
    logger.info(f"[{request_id}] Generation: {generation_time:.2f}s")
    logger.info(f"[{request_id}] Total: {total_time:.2f}s")
    logger.info(f"[{request_id}] " + "=" * 80)

    metrics = {
        "retrieval_latency_ms": retrieval_time * 1000,
        "generation_latency_ms": generation_time * 1000,
        "total_service_latency_ms": total_time * 1000,
        "used_forced_context": forced_context is not None,
        "retrieval_metrics":retrieval_metrics,
    }

    return response, metrics


def stream_chat_response(
    message: str,
    history=None,
    request_id: str = "unknown",
    on_complete=None,
    on_retrieval_complete: Callable[[dict[str, Any]], None] | None = None,
):
    total_start = time.perf_counter()
    retrieval_start = time.perf_counter()
    normalized = message.lower().strip()

    forced_context = None

    if "years of experience" in normalized:
        forced_context = (
            "FACTS: Assem has around 2+ years of hands-on AI engineering "
            "experience spanning production AI systems, retrieval infrastructure, "
            "backend development, evaluation workflows, and applied generative AI products. "
            "His experience includes production work at boxMind.ai, AI evaluation "
            "work through Apple via Inspyr Solutions, internship experience in "
            "computer vision/OCR systems, and independent freelance and personal "
            "engineering projects."
        )

    elif (
        "salary" in normalized
        or "compensation" in normalized
        or "pay expectation" in normalized
        or "salary expectation" in normalized
        or "expected salary" in normalized
        or "salary range" in normalized
    ):
        forced_context = (
            "FACTS: Compensation depends on the role, scope, and overall opportunity. "
            "Assem is open to discussing compensation details directly during the interview process."
        )

    elif (
        "sponsorship" in normalized
        or "work authorization" in normalized
        or "authorized to work" in normalized
        or "green card" in normalized
        or "visa" in normalized
    ):
        forced_context = (
            "FACTS: Assem is fully authorized to work in the United States as a lawful "
            "permanent resident (Green Card holder) and does not require sponsorship. "
        )
    elif (
        "contact" in normalized
        or "reach assem" in normalized
        or "get in touch" in normalized
        or "email" in normalized
        or "linkedin" in normalized
        or "phone" in normalized
        or "call" in normalized
    ):
        forced_context = (
            "FACTS: Visitors can contact Assem directly through LinkedIn, email, or phone. "
            "LinkedIn: [Assem Alhomsi](https://www.linkedin.com/in/assem-alhomsi-bbb87b23a). "
            "Email: [assem.h2001@gmail.com](mailto:assem.h2001@gmail.com). "
            "GitHub: [Assemh01](https://github.com/Assemh01) "
            "Phone: [+1 (313) 247-0367](tel:+13132470367). "
            "Keep the answer concise and provide the links directly."
        )

    if forced_context:
        context = forced_context
        retrieval_metrics = build_forced_context_metrics()
    else:
        context, retrieval_metrics = retrieve_context(
            message,
            k=settings.RETRIEVAL_K,
            request_id=request_id,
        )

    retrieval_time = time.perf_counter() - retrieval_start

    retrieval_metrics["total_retrieval_duration_ms"] = (
        retrieval_time * 1000
    )

    if on_retrieval_complete is not None:
        try:
            on_retrieval_complete(retrieval_metrics)
        except Exception:
            logger.exception(
                f"[{request_id}] Failed to save retrieval analytics"
            )

    debug_print(message, context, request_id)

    generation_start = time.perf_counter()

    response = ""
    first_token_time = None
    status = "success"
    error_message = None

    try:
        for chunk in stream_with_hosted_llm(
            message,
            context,
            history,
        ):
            if first_token_time is None:
                first_token_time = time.perf_counter()

            response += chunk
            yield chunk

    except GeneratorExit:
        status = "cancelled"
        raise

    except Exception as exc:
        status = "error"
        error_message = str(exc)
        raise

    finally:
        end_time = time.perf_counter()

        generation_time = end_time - generation_start
        total_time = end_time - total_start

        first_token_ms = (
            (first_token_time - total_start) * 1000
            if first_token_time is not None
            else None
        )

        metrics = {
            "retrieval_latency_ms": retrieval_time * 1000,
            "generation_latency_ms": generation_time * 1000,
            "total_latency_ms": total_time * 1000,
            "time_to_first_token_ms": first_token_ms,
            "response_text": response,
            "response_length": len(response),
            "status": status,
            "stream_cancelled": status == "cancelled",
            "error_message": error_message,
            "used_forced_context": forced_context is not None,
            "reranking_enabled": retrieval_metrics.get(
                "reranking_enabled",
                False,
            ),
        }

        logger.info(f"[{request_id}] " + "=" * 80)
        logger.info(f"[{request_id}] STREAM LATENCY")
        logger.info(
            f"[{request_id}] Retrieval: "
            f"{metrics['retrieval_latency_ms']:.2f}ms"
        )
        logger.info(
            f"[{request_id}] Generation: "
            f"{metrics['generation_latency_ms']:.2f}ms"
        )
        logger.info(
            f"[{request_id}] Total: "
            f"{metrics['total_latency_ms']:.2f}ms"
        )
        logger.info(
            f"[{request_id}] First token: "
            f"{metrics['time_to_first_token_ms']}ms"
        )
        logger.info(
            f"[{request_id}] Status: {status}, "
            f"response_length={len(response)}"
        )
        logger.info(f"[{request_id}] " + "=" * 80)

        if on_complete is not None:
            try:
                on_complete(metrics)
            except Exception:
                logger.exception(
                    f"[{request_id}] Failed to save stream analytics"
                )

def build_forced_context_metrics() -> dict[str, Any]:
    return {
        "used_forced_context": True,
        "project_query": False,
        "fallback_retrieval_used": False,
        "reranking_enabled": False,
        "retrieved_chunks": 0,
        "reranked_chunks": 0,
        "vector_retrieval_duration_ms": 0.0,
        "fallback_retrieval_duration_ms": 0.0,
        "rerank_duration_ms": 0.0,
        "total_retrieval_duration_ms": 0.0,
        "retrieved_chunk_data": [],
        "reranked_chunk_data": [],
        "chunk_sources": ["forced_context"],
    }