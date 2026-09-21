from fastapi import APIRouter

from app.api.dependencies import CurrentUserDep
from app.schemas.media import MediaPresignRequest, MediaPresignResponse
from app.services.media import create_upload_presign

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/presign", response_model=MediaPresignResponse)
async def presign_upload(
    payload: MediaPresignRequest,
    user: CurrentUserDep,
) -> MediaPresignResponse:
    return await create_upload_presign(user, payload)
