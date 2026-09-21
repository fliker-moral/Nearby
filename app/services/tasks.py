from uuid import UUID

from app.models.enums import TaskStatus, UserRole
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskAuthorRead, TaskRead


def can_view_private_task(task: Task, user: User) -> bool:
    return (
        user.role == UserRole.ADMIN
        or task.author_id == user.id
        or task.assigned_volunteer_id == user.id
    )


def task_to_read_model(
    task: Task,
    *,
    lat: float,
    lon: float,
    viewer: User,
) -> TaskRead:
    private = can_view_private_task(task, viewer)
    return TaskRead(
        id=task.id,
        author_id=task.author_id,
        assigned_volunteer_id=task.assigned_volunteer_id if private else None,
        title=task.title,
        description=task.description,
        category=task.category,
        status=task.status,
        address_hint=task.address_hint,
        address_text=task.address_text if private else None,
        lat=lat if private else round(lat, 3),
        lon=lon if private else round(lon, 3),
        photos=task.photos,
        completion_photo=task.completion_photo if private else None,
        completion_comment=task.completion_comment if private else None,
        moderation_comment=task.moderation_comment if private else None,
        version=task.version,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at if private else None,
        closed_at=task.closed_at if private else None,
        author=TaskAuthorRead(
            id=task.author.id,
            name=task.author.name,
            avatar_url=task.author.avatar_url,
            rating_score=task.author.rating_score,
            rating_count=task.author.rating_count,
        ),
        assigned_to_me=task.assigned_volunteer_id == viewer.id,
    )


def ensure_task_visible(task: Task, viewer: User) -> None:
    if can_view_private_task(task, viewer):
        return
    if task.status != TaskStatus.PUBLISHED or task.assigned_volunteer_id is not None:
        from app.core.errors import APIError

        raise APIError(404, "NOT_FOUND", "Task not found")


def validate_owned_media_keys(keys: list[str], user_id: UUID, purpose: str) -> None:
    expected_prefix = f"users/{user_id}/{purpose}/"
    if any(not key.startswith(expected_prefix) for key in keys):
        from app.core.errors import APIError

        raise APIError(422, "VALIDATION_ERROR", "Invalid media object key")
