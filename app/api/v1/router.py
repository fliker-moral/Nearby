from fastapi import APIRouter

from app.api.v1 import me, media, moderation, tasks

api_router = APIRouter()
api_router.include_router(me.router)
api_router.include_router(tasks.router)
api_router.include_router(moderation.router)
api_router.include_router(media.router)
