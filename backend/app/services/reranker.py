from sentence_transformers import CrossEncoder

MODEL_NAME = "BAAI/bge-reranker-base"

reranker = CrossEncoder(MODEL_NAME)


def rerank_chunks(query: str, chunks: list[dict], top_k: int = 6):
    if not chunks:
        return []

    pairs = [(query, chunk["text"]) for chunk in chunks]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True,
    )

    results = []

    for chunk, score in ranked[:top_k]:
        chunk = {
            **chunk,
            "rerank_score": float(score),
        }
        results.append(chunk)

    return results