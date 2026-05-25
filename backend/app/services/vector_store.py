from typing import Any, Dict, List

import chromadb
from chromadb.utils import embedding_functions
from app.core.config import settings
from app.services.loader import load_knowledge_base
from app.core.logger import logger

COLLECTION_NAME = settings.COLLECTION_NAME


_embedding_function = None

def get_embedding_function():
    global _embedding_function

    if _embedding_function is None:
        logger.info("Loading embedding model...")
        _embedding_function = (
            embedding_functions.SentenceTransformerEmbeddingFunction(
                settings.EMBEDDING_MODEL
            )
        )
        logger.info("Embedding model loaded.")

    return _embedding_function


_collection = None

def get_collection():
    global _collection

    if _collection is None:
        logger.info("Initializing Chroma collection...")

        client = chromadb.PersistentClient(
            path=settings.CHROMA_DIR
        )

        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=get_embedding_function(),
            metadata={
                "description": "Assem portfolio chatbot knowledge base"
            },
        )

        logger.info("Chroma collection initialized.")
        logger.info(
            f"Collection count: { _collection.count() }"
        )

    return _collection

def rebuild_vector_store() -> None:
    docs = load_knowledge_base()
    collection = get_collection()

    existing = collection.get()
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    collection.add(
        ids=[doc["id"] for doc in docs],
        documents=[doc["text"] for doc in docs],
        metadatas=[doc["metadata"] for doc in docs],
    )

    logger.info(f"Indexed {len(docs)} chunks into Chroma.")


def retrieve_relevant_chunks(
        query: str,
        k: int = 6,
        request_id: str = "unknown",
    ) -> List[Dict[str, Any]]:
    collection = get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=k,
    )

    chunks = []

    for i in range(len(results["ids"][0])):
        chunks.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })

    return chunks


if __name__ == "__main__":
    rebuild_vector_store()

    test_query = "Does Assem need sponsorship?"
    results = retrieve_relevant_chunks(test_query)

    logger.info(f"Test query: {test_query}")
    for chunk in results:
        logger.info("---")
        logger.info(f"{chunk['id']} | {chunk['distance']}")
        logger.info(chunk["metadata"])
        logger.info(chunk["text"][:400])