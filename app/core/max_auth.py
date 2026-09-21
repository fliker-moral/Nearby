from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qsl


class MaxAuthError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True, slots=True)
class MaxUserData:
    max_id: int
    name: str
    avatar_url: str | None


@dataclass(frozen=True, slots=True)
class MaxLaunchData:
    user: MaxUserData
    auth_date: int
    query_id: str | None


def _parse_pairs(init_data: str) -> list[tuple[str, str]]:
    try:
        pairs = parse_qsl(
            init_data,
            keep_blank_values=True,
            strict_parsing=True,
        )
    except ValueError as exc:
        raise MaxAuthError("AUTH_INVALID", "Malformed MAX initialization data") from exc

    if not pairs:
        raise MaxAuthError("AUTH_INVALID", "MAX initialization data is empty")

    keys = [key for key, _value in pairs]
    if len(keys) != len(set(keys)):
        raise MaxAuthError("AUTH_INVALID", "Duplicate MAX initialization parameter")
    if keys.count("hash") != 1:
        raise MaxAuthError("AUTH_INVALID", "MAX initialization hash is missing")
    return pairs


def _parse_user(raw_user: str) -> MaxUserData:
    try:
        payload: dict[str, Any] = json.loads(raw_user)
        max_id = int(payload["id"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise MaxAuthError("AUTH_INVALID", "Invalid MAX user data") from exc

    first_name = str(payload.get("first_name") or "").strip()
    last_name = str(payload.get("last_name") or "").strip()
    username = str(payload.get("username") or "").strip()
    name = " ".join(part for part in (first_name, last_name) if part)
    if not name:
        name = username or f"MAX user {max_id}"

    photo_url = payload.get("photo_url")
    avatar_url = str(photo_url) if photo_url else None
    return MaxUserData(max_id=max_id, name=name[:255], avatar_url=avatar_url)


def validate_init_data(
    init_data: str,
    bot_token: str,
    *,
    max_age_seconds: int = 3600,
    future_skew_seconds: int = 30,
    now: int | None = None,
) -> MaxLaunchData:
    if not bot_token:
        raise MaxAuthError("AUTH_INVALID", "MAX bot token is not configured")

    pairs = _parse_pairs(init_data)
    values = dict(pairs)
    supplied_hash = values.pop("hash")
    launch_params = "\n".join(
        f"{key}={value}" for key, value in sorted(values.items())
    )

    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    calculated_hash = hmac.new(
        secret_key,
        launch_params.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(calculated_hash, supplied_hash):
        raise MaxAuthError("AUTH_INVALID", "Invalid MAX initialization signature")

    try:
        auth_date = int(values["auth_date"])
    except (KeyError, TypeError, ValueError) as exc:
        raise MaxAuthError("AUTH_INVALID", "Invalid MAX authorization date") from exc

    current_time = int(time.time()) if now is None else now
    if auth_date > current_time + future_skew_seconds:
        raise MaxAuthError("AUTH_INVALID", "MAX authorization date is in the future")
    if current_time - auth_date > max_age_seconds:
        raise MaxAuthError("AUTH_EXPIRED", "MAX initialization data has expired")

    try:
        raw_user = values["user"]
    except KeyError as exc:
        raise MaxAuthError("AUTH_INVALID", "MAX user data is missing") from exc

    return MaxLaunchData(
        user=_parse_user(raw_user),
        auth_date=auth_date,
        query_id=values.get("query_id"),
    )
