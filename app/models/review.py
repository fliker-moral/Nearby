from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user import User


class Review(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("score BETWEEN 1 AND 5", name="score_between_1_and_5"),
        UniqueConstraint(
            "task_id",
            "author_id",
            "target_user_id",
            name="uq_reviews_task_author_target",
        ),
    )

    task_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    task: Mapped[Task] = relationship(back_populates="reviews")
    author: Mapped[User] = relationship(
        back_populates="written_reviews",
        foreign_keys=[author_id],
    )
    target_user: Mapped[User] = relationship(
        back_populates="received_reviews",
        foreign_keys=[target_user_id],
    )
