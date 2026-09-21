from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text, update

from app.db.session import AsyncSessionFactory, engine
from app.main import app
from app.models.enums import TaskStatus
from app.models.task import Task

pytestmark = pytest.mark.integration


def headers(max_id: int, role: str, name: str = "Test User") -> dict[str, str]:
    return {
        "X-Dev-Max-Id": str(max_id),
        "X-Dev-Name": name,
        "X-Dev-Role": role,
    }


@pytest.fixture(autouse=True)
async def clean_database() -> None:
    async with engine.begin() as connection:
        await connection.execute(text("TRUNCATE reviews, tasks, users CASCADE"))


@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        yield test_client


async def create_task(client: AsyncClient) -> dict[str, object]:
    response = await client.post(
        "/api/v1/tasks",
        headers=headers(1001, "APPLICANT", "Nina Petrova"),
        json={
            "title": "Купить лекарства",
            "description": "Нужно забрать заказ из ближайшей аптеки",
            "category": "PERSONAL_HELP",
            "lat": 55.751244,
            "lon": 37.618423,
            "address_hint": "Тверской район",
            "address_text": "ул. Точная, д. 1, кв. 2",
            "photos": [],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_create_moderate_and_protect_private_address(client: AsyncClient) -> None:
    created = await create_task(client)
    task_id = created["id"]
    assert created["status"] == "PENDING_MODERATION"
    assert created["address_text"] == "ул. Точная, д. 1, кв. 2"

    approved = await client.post(
        f"/api/v1/admin/tasks/{task_id}/approve",
        headers=headers(9001, "ADMIN", "Moderator"),
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "PUBLISHED"

    public = await client.get(
        f"/api/v1/tasks/{task_id}",
        headers=headers(2001, "VOLUNTEER", "Volunteer"),
    )
    assert public.status_code == 200, public.text
    assert public.json()["address_text"] is None
    assert public.json()["lat"] == 55.751
    assert public.json()["lon"] == 37.618

    edited = await client.patch(
        f"/api/v1/tasks/{task_id}",
        headers=headers(1001, "APPLICANT", "Nina Petrova"),
        json={"description": "Обновлённое подробное описание просьбы"},
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["status"] == "PENDING_MODERATION"


async def test_close_and_review_completed_task(client: AsyncClient) -> None:
    created = await create_task(client)
    task_id = UUID(str(created["id"]))

    volunteer_response = await client.get(
        "/api/v1/me",
        headers=headers(2001, "VOLUNTEER", "Ivan Volunteer"),
    )
    volunteer_id = UUID(volunteer_response.json()["id"])

    async with AsyncSessionFactory() as session:
        await session.execute(
            update(Task)
            .where(Task.id == task_id)
            .values(
                assigned_volunteer_id=volunteer_id,
                status=TaskStatus.COMPLETED,
            )
        )
        await session.commit()

    closed = await client.post(
        f"/api/v1/tasks/{task_id}/close",
        headers=headers(1001, "APPLICANT", "Nina Petrova"),
    )
    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "CLOSED"

    review = await client.post(
        f"/api/v1/tasks/{task_id}/reviews",
        headers=headers(1001, "APPLICANT", "Nina Petrova"),
        json={
            "score": 5,
            "tags": ["kindness", "punctuality"],
            "comment": "Спасибо!",
        },
    )
    assert review.status_code == 201, review.text

    duplicate = await client.post(
        f"/api/v1/tasks/{task_id}/reviews",
        headers=headers(1001, "APPLICANT", "Nina Petrova"),
        json={"score": 5, "tags": ["kindness"]},
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "REVIEW_ALREADY_EXISTS"
