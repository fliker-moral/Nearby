import type { TaskCategory, TaskStatus } from './types';

/** База API. В dev проксируется на FastAPI через vite.config.ts. */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

/**
 * Ключ Yandex Maps JS API 3.0. Если задан — карта рисуется на Яндекс.Картах
 * (вид как в Яндекс Go). Если пусто — приложение откатывается на MapLibre.
 */
export const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_API_KEY ?? '';

/** WebSocket-канал карты. */
export const WS_BASE =
  import.meta.env.VITE_WS_BASE ??
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/v1`
    : '');

/** Fallback-стиль карты MapLibre (цветной, читаемый). */
export const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

/** Стартовая точка — центр Москвы. */
export const DEFAULT_CENTER: [number, number] = [37.6183, 55.7512];
export const DEFAULT_ZOOM = 14.5;

export const BRAND = {
  name: 'Помощь рядом',
  tagline: 'Добрые дела делают город ближе',
  city: 'Москва',
};

/** Режим карты: просьбы о помощи или волонтёрские события. */
export type Mode = 'help' | 'events';

/** Подкатегория (иконка/подпись). mode определяет, в каком режиме показывать. */
export interface KindMeta {
  label: string;
  emoji: string;
  mode: Mode;
  category: TaskCategory;
}

export const KIND_META: Record<string, KindMeta> = {
  meds: { label: 'Лекарства', emoji: '💊', mode: 'help', category: 'PERSONAL_HELP' },
  groceries: { label: 'Продукты', emoji: '🛒', mode: 'help', category: 'PERSONAL_HELP' },
  home: { label: 'Помощь дома', emoji: '🏠', mode: 'help', category: 'PERSONAL_HELP' },
  animals: { label: 'Питомцы', emoji: '🐾', mode: 'help', category: 'PERSONAL_HELP' },
  escort: { label: 'Сопровождение', emoji: '🚶', mode: 'help', category: 'PERSONAL_HELP' },
  concert: { label: 'Концерты', emoji: '🎵', mode: 'events', category: 'EVENT_ORGANIZATION' },
  festival: { label: 'Фестивали', emoji: '🎭', mode: 'events', category: 'EVENT_ORGANIZATION' },
  sport: { label: 'Спорт', emoji: '🏆', mode: 'events', category: 'EVENT_ORGANIZATION' },
  eco: { label: 'Экология', emoji: '🌿', mode: 'events', category: 'EVENT_ORGANIZATION' },
};

/** Порядок чипов категорий по режимам. */
export const HELP_CHIPS = ['meds', 'groceries', 'home', 'animals', 'escort'] as const;
export const EVENT_CHIPS = ['concert', 'festival', 'sport', 'eco'] as const;

/** Цвет пина по режиму: помощь — коралл, события — фиолетовый. */
export const MODE_COLOR: Record<Mode, string> = {
  help: '#f0522e',
  events: '#7a5af8',
};

export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PENDING_MODERATION: { label: 'На модерации', color: '#8b95a5' },
  PUBLISHED: { label: 'Свободна', color: '#12b76a' },
  IN_PROGRESS: { label: 'В работе', color: '#f5a623' },
  COMPLETED: { label: 'Выполнена', color: '#2e6bf6' },
  CLOSED: { label: 'Закрыта', color: '#8b95a5' },
  REJECTED: { label: 'Отклонена', color: '#ef4444' },
};
