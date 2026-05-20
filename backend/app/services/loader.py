from pathlib import Path
from typing import Any, Dict, List
from app.core.config import settings
from app.core.logger import logger
import frontmatter


KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / settings.KNOWLEDGE_DIR


def split_markdown_by_headings(content: str) -> List[Dict[str, str]]:
    chunks = []
    current_title = "Overview"
    current_lines = []

    for line in content.splitlines():
        if line.startswith("#"):
            if current_lines:
                chunks.append({
                    "section_title": current_title,
                    "content": "\n".join(current_lines).strip(),
                })

            current_title = line.lstrip("#").strip()
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        chunks.append({
            "section_title": current_title,
            "content": "\n".join(current_lines).strip(),
        })

    return [chunk for chunk in chunks if chunk["content"]]


def load_knowledge_base() -> List[Dict[str, Any]]:
    documents = []

    if not KNOWLEDGE_DIR.exists():
        raise FileNotFoundError(f"Knowledge base folder not found: {KNOWLEDGE_DIR}")

    for file_path in KNOWLEDGE_DIR.glob("*.md"):
        post = frontmatter.load(file_path)

        metadata = {
            "source_file": file_path.name,
            "category": post.metadata.get("category", "unknown"),
            "priority": post.metadata.get("priority", "normal"),
            "visibility": post.metadata.get("visibility", "recruiter_safe"),
            "last_updated": str(post.metadata.get("last_updated", "")),
        }

        sections = split_markdown_by_headings(post.content)

        for index, section in enumerate(sections):
            documents.append({
                "id": f"{file_path.stem}-{index}",
                "text": section["content"],
                "metadata": {
                    **metadata,
                    "section_title": section["section_title"],
                },
            })

    return documents


if __name__ == "__main__":
    docs = load_knowledge_base()
    logger.info(f"Loaded {len(docs)} chunks")
    for doc in docs[:3]:
        logger.info("---")
        logger.info(doc["id"])
        logger.info(doc["metadata"])
        logger.info(doc["text"][:300])