# Рядом — фронтенд (3D-карта волонтёра)

Клиентская часть волонтёрского **MAX Mini App** «Рядом»: школьники-волонтёры
находят на карте заявки пожилых людей (купить лекарства, погулять с собакой,
донести продукты) и берут их в работу — «Яндекс.Доставка», только про заботу.

Сердце интерфейса — **интерактивная 3D-карта**: объёмные здания, наклон камеры,
метки задач по категориям и захват задачи в один тап.

## Стек

- **React 18 + TypeScript + Vite**
- **MapLibre GL JS** — 3D-экструзия зданий, наклон/поворот камеры
- **OpenFreeMap** — бесплатные векторные тайлы с высотами зданий (без API-ключа)
- Интеграция с **MAX Bridge** (авторизация через `initData`), REST + WebSocket
  к FastAPI-бэкенду

## Запуск

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Сборка прод-версии:

```bash
npm run build      # → dist/
npm run preview
```

> Фронтенд работает **автономно**: если бэкенд недоступен, карта показывает
> demo-заявки (`src/data/mockData.ts`), а захват задачи имитируется локально.
> Как только поднят FastAPI (`docker compose up`) — данные и real-time берутся
> с API через прокси `/api` (см. `vite.config.ts`).

## Ключевые возможности

| Возможность | Где |
| :-- | :-- |
| 3D-карта с объёмными зданиями и переключателем 2D/3D | `src/map/` |
| Метки задач по категориям, пульс у свободных | `src/map/marker.ts` |
| Карточка задачи + «Взять задачу» (обработка 409 Conflict) | `src/components/TaskSheet.tsx` |
| Поиск, фильтр по категориям | `src/components/` |
| Экраны: Карта / Избранное / Маршруты / Профиль | `src/screens/` |
| Real-time статусов через WebSocket `/ws/map` | `src/hooks/useTasks.ts` |
| MAX Bridge (auth, haptics), demo-режим вне MAX | `src/lib/maxBridge.ts` |

## Контракт с бэкендом

Типы во `src/types.ts` синхронизированы со схемами FastAPI
(`app/schemas/task.py`, `app/models/enums.py`):

- `GET /api/v1/tasks/map?bbox=…` → список меток `TaskMapItem`
- `POST /api/v1/tasks/{id}/assign` → атомарный захват (`409` — задача уже занята)
- `WS /api/v1/ws/map` → события `TASK_CREATED`, `TASK_STATUS_CHANGED`

## Переменные окружения

См. `.env.example` (`VITE_API_BASE`, `VITE_WS_BASE`, `VITE_MAP_STYLE`,
`VITE_PROXY_TARGET`).
