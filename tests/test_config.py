import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_dev_auth_is_rejected_in_production() -> None:
    with pytest.raises(ValidationError):
        Settings(APP_ENV="production", AUTH_MODE="dev")


def test_dev_auth_is_allowed_locally() -> None:
    settings = Settings(APP_ENV="local", AUTH_MODE="dev")

    assert settings.auth_mode == "dev"


def test_admin_max_ids_are_parsed() -> None:
    settings = Settings(ADMIN_MAX_IDS="1001, 1002")

    assert settings.admin_max_id_set == {1001, 1002}


def test_invalid_admin_max_ids_are_rejected_on_access() -> None:
    settings = Settings(ADMIN_MAX_IDS="1001,not-a-number")

    with pytest.raises(ValueError, match="ADMIN_MAX_IDS"):
        _ = settings.admin_max_id_set
