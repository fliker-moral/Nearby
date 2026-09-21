# Nearby backend

Backend MAX Mini App «Рядом»: заявители публикуют просьбы о помощи, а волонтёры
находят их на карте и берут в работу.

## Стек

- Python 3.12, FastAPI, Pydantic v2
- PostgreSQL 16 + PostGIS, SQLAlchemy 2 async, Alembic
- Redis (следующий этап: Pub/Sub и WebSocket)
- MinIO/S3 для фотографий

## Быстрый запуск

```bash
docker compose up --build
```

После старта:

- API: <http://localhost:8000>
- OpenAPI: <http://localhost:8000/docs>
- readiness: <http://localhost:8000/health/ready>
- MinIO console: <http://localhost:9001>

Docker Compose по умолчанию работает в безопасно ограниченном local dev-auth режиме.
Для запроса укажите:

```text
X-Dev-Max-Id: 1001
X-Dev-Name: Test Applicant
X-Dev-Role: APPLICANT
```

Роль используется только при первом создании dev-пользователя. В production
обязательно задайте `APP_ENV=production`, `AUTH_MODE=max` и `MAX_BOT_TOKEN`.
Приложение не запустится с `AUTH_MODE=dev` вне `local/test`.
Первичных модераторов задайте доверенным списком `ADMIN_MAX_IDS=123,456`;
роль администратора нельзя получить из клиентского запроса.

Полный список переменных находится в `.env.example`.

## Миграции

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic downgrade base
```

При старте контейнера `alembic upgrade head` выполняется автоматически.

## Тесты и lint

```bash
python -m pip install -r requirements-dev.txt
ruff check .
pytest
```

## Реализованный API заявителя

- `GET/PATCH /api/v1/me`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/authored`
- `GET/PATCH /api/v1/tasks/{id}`
- `POST /api/v1/tasks/{id}/cancel`
- `POST /api/v1/tasks/{id}/close`
- `POST /api/v1/tasks/{id}/reviews`
- `GET /api/v1/admin/tasks/moderation`
- `POST /api/v1/admin/tasks/{id}/approve|reject`
- `POST /api/v1/media/presign`

`address_text` и точные координаты доступны только автору, назначенному волонтёру
и администратору. Публичная карточка содержит `address_hint` и округлённую точку.
