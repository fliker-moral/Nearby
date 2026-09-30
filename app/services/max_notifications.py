import asyncio
import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.enums import TaskCategory
from app.models.notification import NotificationSubscription
from app.models.task import Task
from app.models.user import User

logger = logging.getLogger(__name__)


async def notify_subscribers_about_task(session: AsyncSession, task: Task) -> None:
    """Best-effort MAX messages for enabled subscriptions matching a published task."""
    if task.category != TaskCategory.PERSONAL_HELP:
        return
    if not settings.max_bot_token:
        logger.info("MAX notification skipped: MAX_BOT_TOKEN is not configured")
        return

    subscriptions = (
        await session.execute(
            select(User.max_id, NotificationSubscription.city, NotificationSubscription.district)
            .join(NotificationSubscription, NotificationSubscription.user_id == User.id)
            .where(NotificationSubscription.enabled.is_(True))
        )
    ).all()
    searchable_address = f"{task.address_hint} {task.address_text}".casefold()
    recipients = {
        max_id: (city, district)
        for max_id, city, district in subscriptions
        if city.casefold() in searchable_address
        and (not district or district.casefold() in searchable_address)
    }
    if not recipients:
        return

    headers = {"Authorization": settings.max_bot_token, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=8.0) as client:
        semaphore = asyncio.Semaphore(10)

        async def send(max_id: int, city: str, district: str | None) -> None:
            async with semaphore:
                try:
                    area = ", ".join(part for part in (district, city) if part)
                    message = (
                        f"В {area} появилась новая просьба: {task.title}\n\n"
                        "Откройте приложение «Помощь рядом», чтобы посмотреть подробности."
                    )
                    response = await client.post(
                        "https://platform-api2.max.ru/messages",
                        params={"user_id": max_id},
                        headers=headers,
                        json={"text": message},
                    )
                    response.raise_for_status()
                except httpx.HTTPError:
                    logger.exception("Could not send MAX task notification to user %s", max_id)

        await asyncio.gather(
            *(send(max_id, city, district) for max_id, (city, district) in recipients.items())
        )
