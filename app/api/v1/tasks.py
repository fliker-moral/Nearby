from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from app.api.dependencies import (
    ApplicantDep,
    CurrentUserDep,
    EventPublisherDep,
    SessionDep,
)
from app.core.errors import APIError
from app.models.enums import TaskStatus
from app.repositories.tasks import get_task_with_coordinates
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services import applicant_tasks
from app.services.reviews import create_applicant_review
from app.services.tasks import ensure_task_visible, task_to_read_model

router = APIRouter(prefix="/tasks", tags=["tasks"])


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
