from collections import Counter
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.models.enums import TaskStatus
from app.models.review import Review
from app.models.task import Task
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead

ALLOWED_QUALITY_TAGS = {
    "kindness",
    "punctuality",
    "carefulness",
    "communication",
    "reliability",
}


async def create_applicant_review(
    session: AsyncSession,
    applicant: User,
    task_id: UUID,
    payload: ReviewCreate,
) -> ReviewRead:
    unknown_tags = set(payload.tags) - ALLOWED_QUALITY_TAGS
    if unknown_tags:
        raise APIError(
            422,
            "VALIDATION_ERROR",
            "Unknown review tags",
            {"unknown_tags": sorted(unknown_tags)},
        )
    if len(payload.tags) != len(set(payload.tags)):
        raise APIError(422, "VALIDATION_ERROR", "Review tags must be unique")

    task = await session.scalar(select(Task).where(Task.id == task_id))
    if task is None or task.author_id != applicant.id:
        raise APIError(404, "NOT_FOUND", "Task not found")
    if task.status != TaskStatus.CLOSED or task.assigned_volunteer_id is None:
        raise APIError(
            409,
            "INVALID_STATUS_TRANSITION",
            "A closed assigned task is required for a review",
        )

    target = await session.scalar(
        select(User)
        .where(User.id == task.assigned_volunteer_id)
        .with_for_update()
    )
    if target is None:
        raise APIError(404, "NOT_FOUND", "Assigned volunteer not found")

    review = Review(
        task_id=task.id,
        author_id=applicant.id,
        target_user_id=target.id,
        score=payload.score,
        tags=payload.tags,
        comment=payload.comment,
    )
    session.add(review)
    try:
        await session.flush()
        result = await session.execute(
            select(Review.score, Review.tags).where(Review.target_user_id == target.id)
        )
        review_rows = result.all()
        target.rating_count = len(review_rows)
        target.rating_score = sum(row.score for row in review_rows) / len(review_rows)
        counts: Counter[str] = Counter()
        for row in review_rows:
            counts.update(row.tags)
        target.quality_tags = dict(counts)
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise APIError(409, "REVIEW_ALREADY_EXISTS", "Review already exists") from exc
    await session.refresh(review)
    return ReviewRead(
        id=review.id,
        task_id=review.task_id,
        author_id=review.author_id,
        target_user_id=review.target_user_id,
        score=review.score,
        tags=review.tags,
        comment=review.comment,
        created_at=review.created_at,
    )
