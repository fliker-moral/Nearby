from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    tags: list[str] = Field(default_factory=list, max_length=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewRead(BaseModel):
    id: UUID
    task_id: UUID
    author_id: UUID
    target_user_id: UUID
    score: int
    tags: list[str]
    comment: str | None
    created_at: datetime
