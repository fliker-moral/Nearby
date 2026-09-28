"""Add persisted city/district notification filters."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260929_0002"
down_revision: str | None = "20260922_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "notification_subscriptions",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("district", sa.String(length=120), nullable=True),
        sa.Column("enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "city", "district", name="uq_notification_filter"),
    )
    op.create_index("ix_notification_subscriptions_user_id", "notification_subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_subscriptions_user_id", table_name="notification_subscriptions")
    op.drop_table("notification_subscriptions")
