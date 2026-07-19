import secrets

from fastapi import Header, HTTPException, status

from app.core.config import settings


def require_admin(
    authorization: str | None = Header(default=None),
) -> None:
    """
    Validate an admin Bearer token.

    Expected header:
        Authorization: Bearer <ADMIN_KEY>
    """

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authorization required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, separator, token = authorization.partition(" ")

    if (
        not separator
        or scheme.lower() != "bearer"
        or not token
        or not secrets.compare_digest(token, settings.ADMIN_KEY)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin authorization.",
            headers={"WWW-Authenticate": "Bearer"},
        )