from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import (
    APIError,
    api_error_handler,
    validation_error_handler,
)
from app.db.session import engine


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    docs_url="/docs" if settings.app_env in {"local", "dev", "test"} else None,
    redoc_url=None,
    lifespan=lifespan,
)
app.add_exception_handler(APIError, api_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health/live", tags=["health"])
async def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
async def ready() -> dict[str, str]:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception as exc:
        raise APIError(503, "NOT_READY", "Database is unavailable") from exc
    return {"status": "ok"}
