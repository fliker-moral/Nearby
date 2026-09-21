import hashlib
import hmac
import json
from urllib.parse import urlencode

import pytest

from app.core.max_auth import MaxAuthError, validate_init_data

BOT_TOKEN = "test-token"
NOW = 1_800_000_000


def make_init_data(*, auth_date: int = NOW, user_id: int = 42) -> str:
    values = {
        "auth_date": str(auth_date),
        "query_id": "query-1",
        "user": json.dumps(
            {
                "id": user_id,
                "first_name": "Иван",
                "last_name": "Иванов",
                "photo_url": None,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
    }
    launch_params = "\n".join(f"{key}={value}" for key, value in sorted(values.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    values["hash"] = hmac.new(
        secret,
        launch_params.encode(),
        hashlib.sha256,
    ).hexdigest()
    return urlencode(values)


def test_valid_init_data() -> None:
    result = validate_init_data(make_init_data(), BOT_TOKEN, now=NOW)

    assert result.user.max_id == 42
    assert result.user.name == "Иван Иванов"
    assert result.query_id == "query-1"


@pytest.mark.parametrize(
    ("value", "expected_code"),
    [
        (make_init_data() + "&hash=duplicate", "AUTH_INVALID"),
        (make_init_data(auth_date=NOW - 3601), "AUTH_EXPIRED"),
        (make_init_data(auth_date=NOW + 31), "AUTH_INVALID"),
        (make_init_data().replace("query-1", "query-2"), "AUTH_INVALID"),
    ],
)
def test_invalid_init_data(value: str, expected_code: str) -> None:
    with pytest.raises(MaxAuthError) as caught:
        validate_init_data(value, BOT_TOKEN, now=NOW)

    assert caught.value.code == expected_code
