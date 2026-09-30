"""Store the volunteer's cover letter with the accepted task."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260930_0004"
down_revision: str | None = "20260930_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("volunteer_message", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column("tasks", "volunteer_message")
