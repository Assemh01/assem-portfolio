from sentence_transformers import CrossEncoder
from app.core.config import settings

MODEL_NAME = settings.RERANKER_MODEL

reranker = None


def get_reranker():
    global reranker

    if reranker is None:
        reranker = CrossEncoder(MODEL_NAME)

    return reranker


def rerank_chunks(query: str, chunks: list[dict], top_k: int = 6):
    if not chunks:
        return []

    pairs = [(query, chunk["text"]) for chunk in chunks]
    scores = get_reranker().predict(pairs)

    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True,
    )

    return [
        {
            **chunk,
            "rerank_score": float(score),
        }
        for chunk, score in ranked[:top_k]
    ]