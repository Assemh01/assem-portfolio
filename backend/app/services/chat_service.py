from app.services.retriever import retrieve_context
from app.services.local_llm import generate_with_local_llm, stream_with_local_llm

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
    context = retrieve_context(message, k=8)
    debug_print(message, context)
    return generate_with_local_llm(message, context, history)


def stream_chat_response(message: str, history=None):
    context = retrieve_context(message, k=8)
    debug_print(message, context)
    yield from stream_with_local_llm(message, context, history)