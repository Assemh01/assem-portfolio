from app.services.retriever import retrieve_context
from app.services.local_llm import generate_with_local_llm, stream_with_local_llm
from app.services.hosted_llm import generate_with_hosted_llm, stream_with_hosted_llm
import time
from app.core.config import settings
from app.core.logger import logger

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
    ) -> str:
    
    total_start = time.perf_counter()

    retrieval_start = time.perf_counter()
    context = retrieve_context(
        message,
        k=settings.RETRIEVAL_K,
        request_id=request_id,
    )
    retrieval_time = time.perf_counter() - retrieval_start

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

    return response


def stream_chat_response(
        message: str,
        history=None,
        request_id: str = "unknown",
    ):
    total_start = time.perf_counter()

    retrieval_start = time.perf_counter()
    context = retrieve_context(
        message,
        k=settings.RETRIEVAL_K,
        request_id=request_id,
    )
    retrieval_time = time.perf_counter() - retrieval_start

    debug_print(message, context, request_id)

    generation_start = time.perf_counter()

    for chunk in stream_with_hosted_llm(message, context, history):
        yield chunk

    generation_time = time.perf_counter() - generation_start
    total_time = time.perf_counter() - total_start

    logger.info("=" * 80)
    logger.info("LATENCY")
    logger.info(f"Retrieval: {retrieval_time:.2f}s")
    logger.info(f"Generation: {generation_time:.2f}s")
    logger.info(f"Total: {total_time:.2f}s")
    logger.info("=" * 80)