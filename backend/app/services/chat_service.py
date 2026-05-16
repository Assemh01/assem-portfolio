from app.services.retriever import retrieve_context
from app.services.local_llm import generate_with_local_llm, stream_with_local_llm
from app.services.hosted_llm import generate_with_hosted_llm, stream_with_hosted_llm
import time

DEBUG_RETRIEVAL = True


def debug_print(message: str, context: str):
    if not DEBUG_RETRIEVAL:
        return

    print("\n" + "=" * 80)
    print("QUESTION:")
    print(message)
    print("\nRETRIEVED CONTEXT:")
    print(context[:4000])
    print("=" * 80 + "\n")


def generate_chat_response(message: str, history=None) -> str:
    total_start = time.perf_counter()

    retrieval_start = time.perf_counter()
    context = retrieve_context(message, k=8)
    retrieval_time = time.perf_counter() - retrieval_start

    debug_print(message, context)

    generation_start = time.perf_counter()
    response = generate_with_hosted_llm(message, context, history)
    generation_time = time.perf_counter() - generation_start

    total_time = time.perf_counter() - total_start

    print("\n" + "=" * 80)
    print("LATENCY")
    print(f"Retrieval: {retrieval_time:.2f}s")
    print(f"Generation: {generation_time:.2f}s")
    print(f"Total: {total_time:.2f}s")
    print("=" * 80 + "\n")

    return response


def stream_chat_response(message: str, history=None):
    total_start = time.perf_counter()

    retrieval_start = time.perf_counter()
    context = retrieve_context(message, k=8)
    retrieval_time = time.perf_counter() - retrieval_start

    debug_print(message, context)

    generation_start = time.perf_counter()

    for chunk in stream_with_hosted_llm(message, context, history):
        yield chunk

    generation_time = time.perf_counter() - generation_start
    total_time = time.perf_counter() - total_start

    print("\n" + "=" * 80)
    print("LATENCY")
    print(f"Retrieval: {retrieval_time:.2f}s")
    print(f"Generation: {generation_time:.2f}s")
    print(f"Total: {total_time:.2f}s")
    print("=" * 80 + "\n")