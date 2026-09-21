from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import UserRole


class UserBase(BaseModel):
    max_id: int
    name: str = Field(min_length=1, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=512)
    role: UserRole


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=512)
    role: UserRole | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rating_score: float
    rating_count: int
    quality_tags: dict[str, int]
    created_at: datetime
