import logging
from app.core.config import settings 

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("portfolio-api") 