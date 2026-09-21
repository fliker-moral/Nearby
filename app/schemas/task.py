from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import TaskCategory, TaskStatus


class TaskCoordinates(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=5000)
    category: TaskCategory
    address_hint: str = Field(min_length=3, max_length=255)
    address_text: str = Field(min_length=3, max_length=500)


class TaskCreate(TaskBase, TaskCoordinates):
    model_config = ConfigDict(extra="forbid")

    photos: list[str] = Field(default_factory=list, max_length=5)


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    category: TaskCategory | None = None
    address_hint: str | None = Field(default=None, min_length=3, max_length=255)
    address_text: str | None = Field(default=None, min_length=3, max_length=500)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    photos: list[str] | None = Field(default=None, max_length=5)

    @model_validator(mode="after")
    def coordinates_must_be_updated_together(self) -> "TaskUpdate":
        if (self.lat is None) != (self.lon is None):
            raise ValueError("lat and lon must be provided together")
        return self


class TaskAuthorRead(BaseModel):
    id: UUID
    name: str
    avatar_url: str | None
    rating_score: float
    rating_count: int


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    assigned_volunteer_id: UUID | None
    title: str
    description: str
    category: TaskCategory
    status: TaskStatus
    address_hint: str
    address_text: str | None
    lat: float
    lon: float
    photos: list[str]
    completion_photo: str | None
    completion_comment: str | None
    moderation_comment: str | None
    version: int
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    closed_at: datetime | None
    author: TaskAuthorRead
    assigned_to_me: bool


class TaskMapItem(BaseModel):
    id: UUID
    title: str
    category: TaskCategory
    status: TaskStatus
    address_hint: str
    lat: float
    lon: float


class ModerationRejectRequest(BaseModel):
    comment: str = Field(min_length=3, max_length=2000)
