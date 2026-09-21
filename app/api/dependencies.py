from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import APIError
from app.core.max_auth import MaxAuthError, validate_init_data
from app.db.session import get_db_session
from app.models.enums import UserRole
from app.models.user import User
from app.services.auth import upsert_max_user
from app.services.events import EventPublisher, event_publisher

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]

bearer = HTTPBearer(auto_error=False, bearerFormat="MAX WebAppData")


def get_event_publisher() -> EventPublisher:
    return event_publisher


EventPublisherDep = Annotated[EventPublisher, Depends(get_event_publisher)]


async def get_current_user(
    session: SessionDep,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer),
    ],
    x_dev_max_id: Annotated[int | None, Header()] = None,
    x_dev_name: Annotated[str | None, Header()] = None,
    x_dev_role: Annotated[UserRole | None, Header()] = None,
) -> User:
    if settings.auth_mode == "dev":
        if x_dev_max_id is None:
            raise APIError(401, "AUTH_INVALID", "X-Dev-Max-Id header is required")
        return await upsert_max_user(
            session,
            max_id=x_dev_max_id,
            name=(x_dev_name or f"Dev user {x_dev_max_id}")[:255],
            avatar_url=None,
            initial_role=x_dev_role or UserRole.APPLICANT,
        )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise APIError(401, "AUTH_INVALID", "Bearer authorization is required")

    try:
        launch_data = validate_init_data(
            credentials.credentials,
            settings.max_bot_token,
            max_age_seconds=settings.max_auth_max_age_seconds,
            future_skew_seconds=settings.max_auth_future_skew_seconds,
        )
    except MaxAuthError as exc:
        raise APIError(401, exc.code, exc.message) from exc

    return await upsert_max_user(
        session,
        max_id=launch_data.user.max_id,
        name=launch_data.user.name,
        avatar_url=launch_data.user.avatar_url,
        initial_role=(
            UserRole.ADMIN
            if launch_data.user.max_id in settings.admin_max_id_set
            else UserRole.APPLICANT
        ),
    )


CurrentUserDep = Annotated[User, Depends(get_current_user)]


def require_role(user: User, role: UserRole) -> User:
    if user.role not in {role, UserRole.ADMIN}:
        raise APIError(403, "FORBIDDEN", f"Role {role.value} is required")
    return user


def require_applicant(user: CurrentUserDep) -> User:
    return require_role(user, UserRole.APPLICANT)


def require_volunteer(user: CurrentUserDep) -> User:
    return require_role(user, UserRole.VOLUNTEER)


def require_admin(user: CurrentUserDep) -> User:
    if user.role != UserRole.ADMIN:
        raise APIError(403, "FORBIDDEN", "Administrator role is required")
    return user


ApplicantDep = Annotated[User, Depends(require_applicant)]
VolunteerDep = Annotated[User, Depends(require_volunteer)]
AdminDep = Annotated[User, Depends(require_admin)]
