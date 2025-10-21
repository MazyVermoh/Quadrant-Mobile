from datetime import datetime

from pydantic import BaseModel, field_validator


class TelegramAuthData(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str
    locale: str | None = None

    @field_validator("auth_date")
    @classmethod
    def validate_auth_date(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("invalid auth_date")
        return value

    @property
    def auth_datetime(self) -> datetime:
        return datetime.utcfromtimestamp(self.auth_date)
