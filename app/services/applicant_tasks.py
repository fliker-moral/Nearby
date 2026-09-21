from datetime import UTC, datetime
from uuid import UUID

from geoalchemy2.elements import WKTElement
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.models.enums import TaskStatus
from app.models.task import Task
from app.models.user import User
from app.repositories.tasks import get_task_with_coordinates, task_with_coordinates_statement
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.events import EventPublisher
from app.services.tasks import task_to_read_model, validate_owned_media_keys

EDITABLE_STATUSES = {
    TaskStatus.PENDING_MODERATION,
    TaskStatus.REJECTED,
    TaskStatus.PUBLISHED,
}


async def create_task(
    session: AsyncSession,
    applicant: User,
    payload: TaskCreate,
) -> TaskRead:
    validate_owned_media_keys(payload.photos, applicant.id, "task_photo")
    task = Task(
        author_id=applicant.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        status=TaskStatus.PENDING_MODERATION,
        location=WKTElement(f"POINT({payload.lon} {payload.lat})", srid=4326),
        address_hint=payload.address_hint,
        address_text=payload.address_text,
        photos=payload.photos,
    )
    task.author = applicant
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task_to_read_model(
        task,
        lat=payload.lat,
        lon=payload.lon,
        viewer=applicant,
    )


async def list_authored_tasks(
    session: AsyncSession,
    applicant: User,
    *,
    status: TaskStatus | None,
    limit: int,
    offset: int,
) -> list[TaskRead]:
    statement = (
        task_with_coordinates_statement()
        .where(Task.author_id == applicant.id)
        .order_by(Task.created_at.desc(), Task.id.desc())
        .limit(limit)
        .offset(offset)
    )
    if status is not None:
        statement = statement.where(Task.status == status)
    rows = (await session.execute(statement)).all()
    return [
        task_to_read_model(
            row.Task,
            lat=float(row.lat),
            lon=float(row.lon),
            viewer=applicant,
        )
        for row in rows
    ]


async def get_owned_task(
    session: AsyncSession,
    applicant: User,
    task_id: UUID,
) -> tuple[Task, float, float]:
    result = await get_task_with_coordinates(session, task_id)
    if result is None or result[0].author_id != applicant.id:
        raise APIError(404, "NOT_FOUND", "Task not found")
    return result


async def update_task(
    session: AsyncSession,
    applicant: User,
    task_id: UUID,
    payload: TaskUpdate,
) -> TaskRead:
    task, lat, lon = await get_owned_task(session, applicant, task_id)
    if task.status not in EDITABLE_STATUSES or task.assigned_volunteer_id is not None:
        raise APIError(409, "TASK_NOT_EDITABLE", "Task can no longer be edited")

    changes = payload.model_dump(exclude_unset=True)
    new_lat = changes.pop("lat", None)
    new_lon = changes.pop("lon", None)
    if "photos" in changes:
        validate_owned_media_keys(changes["photos"], applicant.id, "task_photo")
    for field, value in changes.items():
        setattr(task, field, value)
    if new_lat is not None and new_lon is not None:
        task.location = WKTElement(f"POINT({new_lon} {new_lat})", srid=4326)
        lat, lon = new_lat, new_lon
    if changes or new_lat is not None:
        task.status = TaskStatus.PENDING_MODERATION
        task.moderation_comment = None
        task.version += 1
    await session.commit()
    await session.refresh(task)
    return task_to_read_model(task, lat=lat, lon=lon, viewer=applicant)


async def cancel_task(
    session: AsyncSession,
    applicant: User,
    task_id: UUID,
    publisher: EventPublisher,
) -> TaskRead:
    task, lat, lon = await get_owned_task(session, applicant, task_id)
    if task.status == TaskStatus.CLOSED:
        return task_to_read_model(task, lat=lat, lon=lon, viewer=applicant)
    if task.status not in EDITABLE_STATUSES or task.assigned_volunteer_id is not None:
        raise APIError(
            409,
            "INVALID_STATUS_TRANSITION",
            "Task cannot be cancelled in its current state",
        )
    task.status = TaskStatus.CLOSED
    task.closed_at = datetime.now(UTC)
    task.version += 1
    await session.commit()
    await session.refresh(task)
    await publisher.publish(
        "TASK_STATUS_CHANGED",
        {"task_id": str(task.id), "new_status": task.status.value},
    )
    return task_to_read_model(task, lat=lat, lon=lon, viewer=applicant)


async def close_task(
    session: AsyncSession,
    applicant: User,
    task_id: UUID,
    publisher: EventPublisher,
) -> TaskRead:
    task, lat, lon = await get_owned_task(session, applicant, task_id)
    if task.status != TaskStatus.COMPLETED:
        raise APIError(
            409,
            "INVALID_STATUS_TRANSITION",
            "Only a completed task can be closed",
        )
    task.status = TaskStatus.CLOSED
    task.closed_at = datetime.now(UTC)
    task.version += 1
    await session.commit()
    await session.refresh(task)
    await publisher.publish(
        "TASK_STATUS_CHANGED",
        {"task_id": str(task.id), "new_status": task.status.value},
    )
    return task_to_read_model(task, lat=lat, lon=lon, viewer=applicant)
