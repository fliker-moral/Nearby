from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import delete, select, update

from app.api.dependencies import CurrentUserDep, SessionDep
from app.core.config import settings
from app.core.errors import APIError
from app.models.notification import NotificationSubscription
from app.schemas.notification import NotificationSubscriptionCreate, NotificationSubscriptionRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/subscriptions", response_model=list[NotificationSubscriptionRead])
async def list_subscriptions(user: CurrentUserDep, session: SessionDep):
    rows = (
        await session.scalars(
            select(NotificationSubscription).where(NotificationSubscription.user_id == user.id)
        )
    ).all()
    return [
        NotificationSubscriptionRead(
            id=str(row.id), city=row.city, district=row.district, enabled=row.enabled
        )
        for row in rows
    ]


@router.post(
    "/subscriptions",
    response_model=NotificationSubscriptionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_subscription(
    payload: NotificationSubscriptionCreate,
    user: CurrentUserDep,
    session: SessionDep,
):
    if payload.enabled and not settings.max_bot_token:
        raise APIError(
            503,
            "MAX_NOTIFICATIONS_NOT_CONFIGURED",
            "Уведомления MAX-бота не настроены. Запустите сервер с MAX_BOT_TOKEN.",
        )
    await session.execute(
        update(NotificationSubscription)
        .where(NotificationSubscription.user_id == user.id)
        .values(enabled=False)
    )
    existing = await session.scalar(
        select(NotificationSubscription).where(
            NotificationSubscription.user_id == user.id,
            NotificationSubscription.city == payload.city,
            NotificationSubscription.district == payload.district,
        )
    )
    row = existing or NotificationSubscription(
        user_id=user.id, city=payload.city, district=payload.district
    )
    row.enabled = payload.enabled
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return NotificationSubscriptionRead(
        id=str(row.id), city=row.city, district=row.district, enabled=row.enabled
    )


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(
    subscription_id: UUID,
    user: CurrentUserDep,
    session: SessionDep,
) -> None:
    await session.execute(
        delete(NotificationSubscription).where(
            NotificationSubscription.id == subscription_id,
            NotificationSubscription.user_id == user.id,
        )
    )
    await session.commit()
