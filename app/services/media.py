from pathlib import PurePosixPath
from uuid import uuid4

import aioboto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.errors import APIError
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.media import MediaPresignRequest, MediaPresignResponse

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


async def _ensure_bucket(client: object) -> None:
    try:
        await client.head_bucket(Bucket=settings.minio_bucket)
    except ClientError:
        await client.create_bucket(Bucket=settings.minio_bucket)


async def create_upload_presign(
    user: User,
    payload: MediaPresignRequest,
) -> MediaPresignResponse:
    allowed_role = {
        "task_photo": UserRole.APPLICANT,
        "completion_photo": UserRole.VOLUNTEER,
    }[payload.purpose.value]
    if user.role not in {allowed_role, UserRole.ADMIN}:
        raise APIError(403, "FORBIDDEN", "Media purpose is not allowed for this role")
    extension = ALLOWED_IMAGE_TYPES.get(payload.content_type)
    if extension is None:
        raise APIError(422, "VALIDATION_ERROR", "Unsupported image content type")
    if payload.size_bytes > settings.media_upload_max_bytes:
        raise APIError(422, "VALIDATION_ERROR", "Image is too large")

    object_key = str(
        PurePosixPath(
            "users",
            str(user.id),
            payload.purpose.value,
            f"{uuid4()}{extension}",
        )
    )
    session = aioboto3.Session()
    async with session.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
    ) as client:
        await _ensure_bucket(client)
    async with session.client(
        "s3",
        endpoint_url=settings.s3_public_endpoint_url,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
    ) as client:
        upload_url = await client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.minio_bucket,
                "Key": object_key,
                "ContentType": payload.content_type,
            },
            ExpiresIn=settings.media_presign_ttl_seconds,
        )
    return MediaPresignResponse(
        upload_url=upload_url,
        object_key=object_key,
        expires_in=settings.media_presign_ttl_seconds,
        headers={"Content-Type": payload.content_type},
    )
