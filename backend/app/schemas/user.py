from pydantic import BaseModel


class UserBase(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    locale: str = "en"


class UserPublic(UserBase):
    id: int
