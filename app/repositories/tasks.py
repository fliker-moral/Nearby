from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task import Task


def task_with_coordinates_statement() -> Select[tuple[Task, float, float]]:
    return select(
        Task,
        func.ST_Y(Task.location).label("lat"),
        func.ST_X(Task.location).label("lon"),
    ).options(selectinload(Task.author))


async def get_task_with_coordinates(
    session: AsyncSession,
    task_id: UUID,
) -> tuple[Task, float, float] | None:
    statement = task_with_coordinates_statement().where(Task.id == task_id)
    row = (await session.execute(statement)).one_or_none()
    if row is None:
        return None
    return row.Task, float(row.lat), float(row.lon)
