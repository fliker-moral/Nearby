from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Enum, Float, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.review import Review
    from app.models.task import Task


class User(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "users"

    max_id: Mapped[int] = mapped_column(
        BigInteger,
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
    )
    rating_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        server_default=text("0"),
    )
    rating_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    quality_tags: Mapped[dict[str, int]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    authored_tasks: Mapped[list[Task]] = relationship(
        back_populates="author",
        foreign_keys="Task.author_id",
    )
    assigned_tasks: Mapped[list[Task]] = relationship(
        back_populates="assigned_volunteer",
        foreign_keys="Task.assigned_volunteer_id",
    )
    written_reviews: Mapped[list[Review]] = relationship(
        back_populates="author",
        foreign_keys="Review.author_id",
    )
    received_reviews: Mapped[list[Review]] = relationship(
        back_populates="target_user",
        foreign_keys="Review.target_user_id",
    )
