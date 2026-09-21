import pytest
from pydantic import ValidationError

from app.schemas.task import TaskUpdate


def test_coordinates_must_be_updated_together() -> None:
    with pytest.raises(ValidationError):
        TaskUpdate(lat=55.7)


def test_status_cannot_be_patched() -> None:
    with pytest.raises(ValidationError):
        TaskUpdate.model_validate({"status": "CLOSED"})
