from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.user import User


async def upsert_max_user(
    session: AsyncSession,
    *,
    max_id: int,
    name: str,
    avatar_url: str | None,
    initial_role: UserRole = UserRole.APPLICANT,
) -> User:
    update_values: dict[str, object] = {"name": name, "avatar_url": avatar_url}
    if initial_role == UserRole.ADMIN:
        update_values["role"] = UserRole.ADMIN
    statement = (
        insert(User)
        .values(
            max_id=max_id,
            name=name,
            avatar_url=avatar_url,
            role=initial_role,
        )
        .on_conflict_do_update(
            index_elements=[User.max_id],
            set_=update_values,
        )
        .returning(User)
    )
    user = (await session.scalars(statement)).one()
    await session.commit()
    return user
