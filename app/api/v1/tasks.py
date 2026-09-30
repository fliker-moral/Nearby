from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status
from sqlalchemy import func, select, update

from app.api.dependencies import (
    ApplicantDep,
    CurrentUserDep,
    EventPublisherDep,
    SessionDep,
    VolunteerDep,
)
from app.core.config import settings
from app.core.errors import APIError
from app.models.enums import TaskCategory, TaskStatus, UserRole
from app.models.task import Task
from app.models.user import User
from app.repositories.tasks import get_task_with_coordinates, task_with_coordinates_statement
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.task import (
    AssignTaskRequest,
    CommunityStatsRead,
    MonthlyStat,
    TaskCreate,
    TaskMapItem,
    TaskRead,
    TaskUpdate,
)
from app.services import applicant_tasks
from app.services.reviews import create_applicant_review
from app.services.tasks import ensure_task_visible, task_to_read_model

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/map", response_model=list[TaskRead])
async def list_map_tasks(
    user: CurrentUserDep,
    session: SessionDep,
    bbox: str | None = None,
    category: TaskCategory | None = None,
    city: str | None = None,
    district: str | None = None,
) -> list[TaskRead]:
    statement = (
        task_with_coordinates_statement()
        .where(Task.status == TaskStatus.PUBLISHED, Task.assigned_volunteer_id.is_(None))
        .order_by(Task.created_at.desc())
    )
    if category is not None:
        statement = statement.where(Task.category == category)
    if city:
        statement = statement.where(
            Task.address_hint.ilike(f"%{city.strip()}%")
            | Task.address_text.ilike(f"%{city.strip()}%")
        )
    if district:
        statement = statement.where(
            Task.address_hint.ilike(f"%{district.strip()}%")
            | Task.address_text.ilike(f"%{district.strip()}%")
        )
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = (float(part) for part in bbox.split(","))
        except ValueError as exc:
            raise APIError(422, "VALIDATION_ERROR", "bbox must contain four numbers") from exc
        statement = statement.where(
            func.ST_X(Task.location).between(min_lon, max_lon),
            func.ST_Y(Task.location).between(min_lat, max_lat),
        )
    rows = (await session.execute(statement.limit(200))).all()
    return [
        task_to_read_model(row.Task, lat=float(row.lat), lon=float(row.lon), viewer=user)
        for row in rows
    ]


@router.get("/assigned", response_model=list[TaskRead])
async def list_assigned_tasks(
    volunteer: VolunteerDep,
    session: SessionDep,
) -> list[TaskRead]:
    statement = (
        task_with_coordinates_statement()
        .where(Task.assigned_volunteer_id == volunteer.id)
        .order_by(Task.updated_at.desc(), Task.id.desc())
        .limit(100)
    )
    rows = (await session.execute(statement)).all()
    return [
        task_to_read_model(row.Task, lat=float(row.lat), lon=float(row.lon), viewer=volunteer)
        for row in rows
    ]


@router.post("/{task_id}/assign", response_model=TaskMapItem)
async def assign_task(
    task_id: UUID,
    payload: AssignTaskRequest,
    volunteer: VolunteerDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskMapItem:
    result = await session.execute(
        update(Task)
        .where(
            Task.id == task_id,
            Task.status == TaskStatus.PUBLISHED,
            Task.assigned_volunteer_id.is_(None),
        )
        .values(
            assigned_volunteer_id=volunteer.id,
            volunteer_message=payload.cover_letter,
            status=TaskStatus.IN_PROGRESS,
            version=Task.version + 1,
        )
    )
    if result.rowcount != 1:
        raise APIError(409, "TASK_ALREADY_ASSIGNED", "Task is no longer available")
    await session.commit()
    task, lat, lon = await get_task_with_coordinates(session, task_id)  # type: ignore[misc]
    await publisher.publish(
        "TASK_STATUS_CHANGED", {"task_id": str(task_id), "new_status": TaskStatus.IN_PROGRESS.value}
    )
    return TaskMapItem(
        id=task.id, title=task.title, category=task.category, status=task.status,
        schedule_text=task.schedule_text,
        address_hint=task.address_hint, lat=lat, lon=lon,
    )


@router.post("/{task_id}/withdraw", response_model=TaskMapItem)
async def withdraw_task(
    task_id: UUID,
    volunteer: VolunteerDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskMapItem:
    result = await session.execute(
        update(Task)
        .where(
            Task.id == task_id,
            Task.assigned_volunteer_id == volunteer.id,
            Task.status == TaskStatus.IN_PROGRESS,
        )
        .values(
            assigned_volunteer_id=None,
            volunteer_message=None,
            status=TaskStatus.PUBLISHED,
            version=Task.version + 1,
        )
    )
    if result.rowcount != 1:
        raise APIError(409, "TASK_NOT_WITHDRAWABLE", "This task is no longer assigned to you")
    await session.commit()
    task, lat, lon = await get_task_with_coordinates(session, task_id)  # type: ignore[misc]
    reopened = TaskMapItem(
        id=task.id, title=task.title, category=task.category, status=task.status,
        schedule_text=task.schedule_text,
        address_hint=task.address_hint, lat=lat, lon=lon,
    )
    await publisher.publish("TASK_CREATED", reopened.model_dump(mode="json"))
    return reopened


@router.post("/{task_id}/complete", response_model=TaskRead)
async def complete_assigned_task(
    task_id: UUID,
    volunteer: VolunteerDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskRead:
    result = await session.execute(
        update(Task)
        .where(
            Task.id == task_id,
            Task.assigned_volunteer_id == volunteer.id,
            Task.status == TaskStatus.IN_PROGRESS,
        )
        .values(
            status=TaskStatus.COMPLETED,
            completed_at=datetime.now(UTC),
            version=Task.version + 1,
        )
    )
    if result.rowcount != 1:
        raise APIError(409, "TASK_NOT_COMPLETABLE", "This task is no longer assigned to you")
    await session.commit()
    task, lat, lon = await get_task_with_coordinates(session, task_id)  # type: ignore[misc]
    await publisher.publish(
        "TASK_STATUS_CHANGED", {"task_id": str(task_id), "new_status": TaskStatus.COMPLETED.value}
    )
    return task_to_read_model(task, lat=lat, lon=lon, viewer=volunteer)


@router.get("/stats/monthly", response_model=list[MonthlyStat])
async def monthly_stats(session: SessionDep) -> list[MonthlyStat]:
    user_month = func.to_char(func.date_trunc("month", User.created_at), "YYYY-MM")
    task_month = func.to_char(func.date_trunc("month", Task.created_at), "YYYY-MM")
    user_rows = (
        await session.execute(
            select(
                user_month.label("month"),
                func.count(User.id).label("participants"),
            )
            .group_by(user_month)
            .order_by(user_month.desc())
            .limit(12)
        )
    ).all()
    task_rows = (
        await session.execute(
            select(
                task_month.label("month"),
                func.count(Task.id).label("completed_tasks"),
            )
            .where(
                Task.category == TaskCategory.PERSONAL_HELP,
                Task.status.in_([TaskStatus.COMPLETED, TaskStatus.CLOSED]),
            )
            .group_by(task_month)
        )
    ).all()
    completed_by_month = {row.month: row.completed_tasks for row in task_rows}
    return [
        MonthlyStat(
            month=row.month,
            participants=row.participants,
            completed_tasks=completed_by_month.get(row.month, 0),
        )
        for row in user_rows
    ]


@router.get("/stats/community", response_model=CommunityStatsRead)
async def community_stats(session: SessionDep) -> CommunityStatsRead:
    participants = await session.scalar(
        select(func.count(User.id)).where(User.role.in_([UserRole.APPLICANT, UserRole.VOLUNTEER]))
    )
    completed_tasks = await session.scalar(
        select(func.count(Task.id)).where(Task.completed_at.is_not(None))
    )
    return CommunityStatsRead(
        participants=participants or 0,
        completed_tasks=completed_tasks or 0,
        goal=settings.community_goal,
    )


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    applicant: ApplicantDep,
    session: SessionDep,
) -> TaskRead:
    return await applicant_tasks.create_task(session, applicant, payload)


@router.get("/authored", response_model=list[TaskRead])
async def list_authored_tasks(
    applicant: ApplicantDep,
    session: SessionDep,
    task_status: Annotated[TaskStatus | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TaskRead]:
    return await applicant_tasks.list_authored_tasks(
        session,
        applicant,
        status=task_status,
        limit=limit,
        offset=offset,
    )


@router.get("/{task_id}", response_model=TaskRead)
async def read_task(
    task_id: UUID,
    user: CurrentUserDep,
    session: SessionDep,
) -> TaskRead:
    result = await get_task_with_coordinates(session, task_id)
    if result is None:
        raise APIError(404, "NOT_FOUND", "Task not found")
    task, lat, lon = result
    ensure_task_visible(task, user)
    return task_to_read_model(task, lat=lat, lon=lon, viewer=user)


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    applicant: ApplicantDep,
    session: SessionDep,
) -> TaskRead:
    return await applicant_tasks.update_task(session, applicant, task_id, payload)


@router.post("/{task_id}/cancel", response_model=TaskRead)
async def cancel_task(
    task_id: UUID,
    applicant: ApplicantDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskRead:
    return await applicant_tasks.cancel_task(
        session,
        applicant,
        task_id,
        publisher,
    )


@router.post("/{task_id}/close", response_model=TaskRead)
async def close_task(
    task_id: UUID,
    applicant: ApplicantDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskRead:
    return await applicant_tasks.close_task(
        session,
        applicant,
        task_id,
        publisher,
    )


@router.post(
    "/{task_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    task_id: UUID,
    payload: ReviewCreate,
    applicant: ApplicantDep,
    session: SessionDep,
) -> ReviewRead:
    return await create_applicant_review(session, applicant, task_id, payload)
