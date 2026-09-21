from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.dependencies import AdminDep, EventPublisherDep, SessionDep
from app.schemas.task import ModerationRejectRequest, TaskRead
from app.services.moderation import list_pending_tasks, moderate_task

router = APIRouter(prefix="/admin/tasks", tags=["moderation"])


@router.get("/moderation", response_model=list[TaskRead])
async def moderation_queue(
    admin: AdminDep,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[TaskRead]:
    return await list_pending_tasks(
        session,
        admin,
        limit=limit,
        offset=offset,
    )


@router.post("/{task_id}/approve", response_model=TaskRead)
async def approve_task(
    task_id: UUID,
    admin: AdminDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskRead:
    return await moderate_task(
        session,
        admin,
        task_id,
        approve=True,
        rejection_comment=None,
        publisher=publisher,
    )


@router.post("/{task_id}/reject", response_model=TaskRead)
async def reject_task(
    task_id: UUID,
    payload: ModerationRejectRequest,
    admin: AdminDep,
    session: SessionDep,
    publisher: EventPublisherDep,
) -> TaskRead:
    return await moderate_task(
        session,
        admin,
        task_id,
        approve=False,
        rejection_comment=payload.comment,
        publisher=publisher,
    )
