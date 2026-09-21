"""Create initial Nearby domain schema.

Revision ID: 20260922_0001
Revises:
Create Date: 2026-09-22
"""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260922_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = postgresql.ENUM(
    "APPLICANT",
    "VOLUNTEER",
    "ADMIN",
    name="user_role",
    create_type=False,
)
task_category = postgresql.ENUM(
    "PERSONAL_HELP",
    "EVENT_ORGANIZATION",
    "OTHER",
    name="task_category",
    create_type=False,
)
task_status = postgresql.ENUM(
    "PENDING_MODERATION",
    "PUBLISHED",
    "IN_PROGRESS",
    "COMPLETED",
    "CLOSED",
    "REJECTED",
    name="task_status",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    user_role.create(bind, checkfirst=True)
    task_category.create(bind, checkfirst=True)
    task_status.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("max_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
        sa.Column("role", user_role, nullable=False),
        sa.Column("rating_score", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.Column("rating_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "quality_tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("max_id", name="uq_users_max_id"),
    )
    op.create_table(
        "tasks",
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_volunteer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", task_category, nullable=False),
        sa.Column(
            "status",
            task_status,
            server_default=sa.text("'PENDING_MODERATION'"),
            nullable=False,
        ),
        sa.Column(
            "location",
            geoalchemy2.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                spatial_index=False,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=False,
        ),
        sa.Column("address_hint", sa.String(length=255), nullable=False),
        sa.Column("address_text", sa.String(length=500), nullable=False),
        sa.Column(
            "photos",
            postgresql.ARRAY(sa.String()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
        sa.Column("completion_photo", sa.String(length=512), nullable=True),
        sa.Column("completion_comment", sa.Text(), nullable=True),
        sa.Column("moderation_comment", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["assigned_volunteer_id"],
            ["users.id"],
            name="fk_tasks_assigned_volunteer_id_users",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
            name="fk_tasks_author_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_tasks"),
    )
    op.create_index("ix_tasks_assigned_volunteer_id", "tasks", ["assigned_volunteer_id"])
    op.create_index("ix_tasks_author_id", "tasks", ["author_id"])
    op.create_index("ix_tasks_category", "tasks", ["category"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index(
        "ix_tasks_status_category_created_at",
        "tasks",
        ["status", "category", "created_at"],
    )
    op.create_index(
        "idx_tasks_location",
        "tasks",
        ["location"],
        postgresql_using="gist",
    )

    op.create_table(
        "reviews",
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "score BETWEEN 1 AND 5",
            name="ck_reviews_score_between_1_and_5",
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
            name="fk_reviews_author_id_users",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_user_id"],
            ["users.id"],
            name="fk_reviews_target_user_id_users",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["task_id"],
            ["tasks.id"],
            name="fk_reviews_task_id_tasks",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_reviews"),
        sa.UniqueConstraint(
            "task_id",
            "author_id",
            "target_user_id",
            name="uq_reviews_task_author_target",
        ),
    )
    op.create_index("ix_reviews_author_id", "reviews", ["author_id"])
    op.create_index("ix_reviews_target_user_id", "reviews", ["target_user_id"])
    op.create_index("ix_reviews_task_id", "reviews", ["task_id"])


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_index("ix_reviews_task_id", table_name="reviews")
    op.drop_index("ix_reviews_target_user_id", table_name="reviews")
    op.drop_index("ix_reviews_author_id", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("idx_tasks_location", table_name="tasks", postgresql_using="gist")
    op.drop_index("ix_tasks_status_category_created_at", table_name="tasks")
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_category", table_name="tasks")
    op.drop_index("ix_tasks_author_id", table_name="tasks")
    op.drop_index("ix_tasks_assigned_volunteer_id", table_name="tasks")
    op.drop_table("tasks")
    op.drop_table("users")
    task_status.drop(bind, checkfirst=True)
    task_category.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)
