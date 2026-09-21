from __future__ import annotations

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from geoalchemy2 import Geometry

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin
from app.models.enums import TaskCategory, TaskStatus


class Task(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "tasks"

    author_id: Mapped[PGUUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_volunteer_id: Mapped[PGUUID | None] = mapped_column(
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
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status"),
        nullable=False,
        default=TaskStatus.PENDING_MODERATION,
        server_default=TaskStatus.PENDING_MODERATION.value,
    )
    location = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    address_text: Mapped[str] = mapped_column(String(500), nullable=False)
    photos: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default=text("'{}'::text[]"),
    )
    completion_photo: Mapped[str | None] = mapped_column(String(512), nullable=True)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    author: Mapped["User"] = relationship(
        back_populates="authored_tasks",
        foreign_keys=[author_id],
    )
    assigned_volunteer: Mapped["User | None"] = relationship(
        back_populates="assigned_tasks",
        foreign_keys=[assigned_volunteer_id],
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
    )
