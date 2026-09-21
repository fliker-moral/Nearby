from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UpdatedAtMixin, UUIDPrimaryKeyMixin
from app.models.enums import TaskCategory, TaskStatus

if TYPE_CHECKING:
    from app.models.review import Review
    from app.models.user import User


class Task(UUIDPrimaryKeyMixin, CreatedAtMixin, UpdatedAtMixin, Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("ix_tasks_status_category_created_at", "status", "category", "created_at"),
    )

    author_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_volunteer_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[TaskCategory] = mapped_column(
        Enum(TaskCategory, name="task_category"),
        nullable=False,
        index=True,
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status"),
        nullable=False,
        default=TaskStatus.PENDING_MODERATION,
        server_default=TaskStatus.PENDING_MODERATION.value,
        index=True,
    )
    location = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    address_hint: Mapped[str] = mapped_column(String(255), nullable=False)
    address_text: Mapped[str] = mapped_column(String(500), nullable=False)
    photos: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default=text("'{}'::text[]"),
    )
    completion_photo: Mapped[str | None] = mapped_column(String(512), nullable=True)
    completion_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    moderation_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    author: Mapped[User] = relationship(
        back_populates="authored_tasks",
        foreign_keys=[author_id],
    )
    assigned_volunteer: Mapped[User | None] = relationship(
        back_populates="assigned_tasks",
        foreign_keys=[assigned_volunteer_id],
    )
    reviews: Mapped[list[Review]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
    )
