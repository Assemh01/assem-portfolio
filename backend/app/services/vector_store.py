from typing import Any, Dict, List

import chromadb
from chromadb.utils import embedding_functions

from app.services.loader import load_knowledge_base


CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "assem_portfolio_knowledge"


def get_embedding_function():
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="BAAI/bge-base-en-v1.5"
    )


def get_collection():
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=get_embedding_function(),
        metadata={"description": "Assem portfolio chatbot knowledge base"},
    )


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

    print(f"Indexed {len(docs)} chunks into Chroma.")


def retrieve_relevant_chunks(query: str, k: int = 6) -> List[Dict[str, Any]]:
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

    print("\nTest query:", test_query)
    for chunk in results:
        print("---")
        print(chunk["id"], chunk["distance"])
        print(chunk["metadata"])
        print(chunk["text"][:400])