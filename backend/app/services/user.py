from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user import UserRepository
from app.schemas.user import UserPublic


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.users = UserRepository(session)

    async def get_or_create(
        self,
        telegram_id: int,
        username: str | None,
        first_name: str | None,
        last_name: str | None,
        locale: str = "en",
        avatar_url: str | None = None,
    ) -> UserPublic:
        user = await self.users.get_by_telegram_id(telegram_id)
        created = False
        if user is None:
            user = await self.users.create(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
                last_name=last_name,
                locale=locale,
                avatar_url=avatar_url,
            )
            created = True
        if created:
            await self.users.session.commit()

        return UserPublic(
            id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            locale=user.locale,
        )
