from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TaskCategory, TaskStatus


class TaskCoordinates(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    category: TaskCategory
    address_text: str = Field(min_length=1, max_length=500)


class TaskCreate(TaskBase, TaskCoordinates):
    photos: list[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    category: TaskCategory | None = None
    status: TaskStatus | None = None
    address_text: str | None = Field(default=None, min_length=1, max_length=500)
    completion_photo: str | None = Field(default=None, max_length=512)
    photos: list[str] | None = None


class TaskAssignRequest(BaseModel):
    volunteer_id: UUID


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    assigned_volunteer_id: UUID | None
    title: str
    description: str
    category: TaskCategory
    status: TaskStatus
    address_text: str
    photos: list[str]
    completion_photo: str | None
    version: int
    created_at: datetime


class TaskMapItem(BaseModel):
    id: UUID
    title: str
    category: TaskCategory
    status: TaskStatus
    lat: float
    lon: float
