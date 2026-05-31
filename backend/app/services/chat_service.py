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
            "GitHub: [Assemh01](https://github.com/Assemh01)"
            "Phone: [+1 (313) 247-0367](tel:+13132470367). "
            "Keep the answer concise and provide the links directly."
        )

    if forced_context:
        context = forced_context
    else:
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
            "LinkedIn: [Assem Alhomsi](www.linkedin.com/in/assem-alhomsi-bbb87b23a). "
            "Email: [assem.h2001@gmail.com](mailto:assem.h2001@gmail.com). "
            "GitHub: [Assemh01](https://github.com/Assemh01)"
            "Phone: [+1 (313) 247-0367](tel:+13132470367). "
            "Keep the answer concise and provide the links directly."
        )

    if forced_context:
        context = forced_context
    else:
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