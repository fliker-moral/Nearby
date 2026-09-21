from enum import StrEnum

from pydantic import BaseModel, Field


class MediaPurpose(StrEnum):
    TASK_PHOTO = "task_photo"
    COMPLETION_PHOTO = "completion_photo"


class MediaPresignRequest(BaseModel):
    purpose: MediaPurpose
    content_type: str
    size_bytes: int = Field(gt=0)


class MediaPresignResponse(BaseModel):
    upload_url: str
    object_key: str
    expires_in: int
    headers: dict[str, str]
