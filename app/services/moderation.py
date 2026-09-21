from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.models.enums import TaskStatus
from app.models.task import Task
from app.models.user import User
from app.repositories.tasks import get_task_with_coordinates, task_with_coordinates_statement
from app.schemas.task import TaskRead
from app.services.events import EventPublisher
from app.services.tasks import task_to_read_model


async def list_pending_tasks(
    session: AsyncSession,
    admin: User,
    *,
    limit: int,
    offset: int,
) -> list[TaskRead]:
    statement = (
        task_with_coordinates_statement()
        .where(Task.status == TaskStatus.PENDING_MODERATION)
        .order_by(Task.created_at.asc(), Task.id.asc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await session.execute(statement)).all()
    return [
        task_to_read_model(
            row.Task,
            lat=float(row.lat),
            lon=float(row.lon),
            viewer=admin,
        )
        for row in rows
    ]


async def moderate_task(
    session: AsyncSession,
    admin: User,
    task_id: UUID,
    *,
    approve: bool,
    rejection_comment: str | None,
    publisher: EventPublisher,
) -> TaskRead:
    result = await get_task_with_coordinates(session, task_id)
    if result is None:
        raise APIError(404, "NOT_FOUND", "Task not found")
    task, lat, lon = result
    if task.status != TaskStatus.PENDING_MODERATION:
        raise APIError(
            409,
            "INVALID_STATUS_TRANSITION",
            "Only a pending task can be moderated",
        )
    task.status = TaskStatus.PUBLISHED if approve else TaskStatus.REJECTED
    task.moderation_comment = None if approve else rejection_comment
    task.version += 1
    await session.commit()
    await session.refresh(task)
    await publisher.publish(
        "TASK_CREATED" if approve else "TASK_STATUS_CHANGED",
        {"task_id": str(task.id), "new_status": task.status.value},
    )
    return task_to_read_model(task, lat=lat, lon=lon, viewer=admin)
