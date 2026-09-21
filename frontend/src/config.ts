import type { TaskCategory, TaskStatus } from './types';

/** База API. В dev проксируется на FastAPI через vite.config.ts. */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

/**
 * Ключ Yandex Maps JS API 3.0. Если задан — карта рисуется на Яндекс.Картах
 * (вид как в Яндекс Go). Если пусто — приложение откатывается на MapLibre,
 * чтобы работать без ключа «в один клик».
 */
export const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_API_KEY ?? '';

/** WebSocket-канал карты. */
export const WS_BASE =
  import.meta.env.VITE_WS_BASE ??
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1`
    : '');

/**
 * Стиль карты. Liberty — цветной читаемый стиль (парки, вода, дороги, подписи),
 * как в Яндекс Go. Используем его в плоском 2D-режиме: без наклона и 3D-зданий,
 * поэтому нагрузки 3D нет, а карта хорошо различима.
 * OpenFreeMap — бесплатные векторные тайлы без API-ключа.
 */
export const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

/** Стартовая точка карты — центр Москвы (совпадает с примерами в архитектуре). */
export const DEFAULT_CENTER: [number, number] = [37.6183, 55.7512];
export const DEFAULT_ZOOM = 14.5;

export interface CategoryMeta {
  label: string;
  short: string;
  color: string;
  emoji: string;
}

export const CATEGORY_META: Record<TaskCategory, CategoryMeta> = {
  PERSONAL_HELP: {
    label: 'Личная помощь',
    short: 'Помощь',
    color: '#ff5470',
    emoji: '🤝',
  },
  EVENT_ORGANIZATION: {
    label: 'Мероприятие',
    short: 'Событие',
    color: '#7c5cff',
    emoji: '🎉',
  },
  OTHER: {
    label: 'Другое',
    short: 'Другое',
    color: '#1f8fff',
    emoji: '📦',
  },
};

export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PENDING_MODERATION: { label: 'На модерации', color: '#9aa4b2' },
  PUBLISHED: { label: 'Свободна', color: '#22c55e' },
  IN_PROGRESS: { label: 'В работе', color: '#f59e0b' },
  COMPLETED: { label: 'Выполнена', color: '#1f8fff' },
  CLOSED: { label: 'Закрыта', color: '#9aa4b2' },
  REJECTED: { label: 'Отклонена', color: '#ef4444' },
};
