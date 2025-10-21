from collections.abc import AsyncIterator

from fastapi import Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import SessionLocal
from app.core.telegram import verify_telegram_init_data
from app.schemas.auth import TelegramAuthData


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def get_telegram_auth_data(
    x_telegram_init_data: str | None = Header(
        default=None, alias="X-Telegram-Init-Data", convert_underscores=False
    )
) -> TelegramAuthData:
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing_telegram_payload",
        )
    return verify_telegram_init_data(x_telegram_init_data)
