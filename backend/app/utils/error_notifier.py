import requests
import time
from app.core.config import settings
from app.core.logger import logger

LAST_ERROR_TIME = 0
ERROR_COOLDOWN_SECONDS = 300  # 5 minutes

def send_error_notification(message: str):

    global LAST_ERROR_TIME

    current_time = time.time()

    # Prevent alert spam
    if (
        current_time - LAST_ERROR_TIME
        < ERROR_COOLDOWN_SECONDS
    ):
        return

    LAST_ERROR_TIME = current_time

    if (
        not settings.TELEGRAM_BOT_TOKEN
        or not settings.TELEGRAM_CHAT_ID
    ):
        logger.warning("Telegram alerts not configured.")
        return

    url = (
        f"https://api.telegram.org/bot"
        f"{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    )

    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": message,
    }

    try:
        requests.post(
            url,
            json=payload,
            timeout=5,
        )

        LAST_ERROR_TIME = current_time

    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")