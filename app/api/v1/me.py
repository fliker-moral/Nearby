from fastapi import APIRouter

from app.api.dependencies import CurrentUserDep, SessionDep
from app.core.errors import APIError
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserRead, UserRoleSelection, UserUpdate

router = APIRouter(prefix="/me", tags=["profile"])


@router.get("", response_model=UserRead)
async def read_me(user: CurrentUserDep) -> User:
    return user


@router.patch("", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    user: CurrentUserDep,
    session: SessionDep,
) -> User:
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(user, field, value)
    await session.commit()
    await session.refresh(user)
    return user


@router.patch("/role", response_model=UserRead)
async def select_role(
    payload: UserRoleSelection,
    user: CurrentUserDep,
    session: SessionDep,
) -> User:
    if user.role == UserRole.ADMIN:
        raise APIError(403, "ROLE_CHANGE_FORBIDDEN", "Administrator role cannot be changed")
    user.role = payload.role
    await session.commit()
    await session.refresh(user)
    return user
