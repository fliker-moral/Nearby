// Типы синхронизированы с бэкендом (app/models/enums.py, app/schemas/*),
// расширены UI-полями для интерфейса «Помощь рядом».

export type TaskCategory = 'PERSONAL_HELP' | 'EVENT_ORGANIZATION' | 'OTHER';

export type TaskStatus =
  | 'PENDING_MODERATION'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REJECTED';

export type UserRole = 'APPLICANT' | 'VOLUNTEER' | 'ADMIN';

/** Лёгкая метка для карты — соответствует schemas.TaskMapItem. */
export interface TaskMapItem {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  lat: number;
  lon: number;
}

/** Автор просьбы (пожилой человек) или организатор события. */
export interface TaskAuthor {
  id: string;
  name: string;
  age?: number;
  avatar_url: string | null;
  verified?: boolean;
  rating_score: number;
  rating_count: number;
}

/** Полная карточка — schemas.TaskRead + UI-поля. */
export interface Task extends TaskMapItem {
  description: string;
  address_text: string;
  photos: string[];
  author: TaskAuthor;
  created_at: string;
  /** Подкатегория для иконки: meds/groceries/home/animals/escort или concert/... */
  kind: string;
  /** Предвычисленное расстояние (для demo), метры. */
  distance_m?: number;
  eta_minutes?: number;
  /** Опыт/баллы волонтёра за выполнение. */
  reward_xp?: number;
  /** Расходы возмещаются (чек оплачивается). */
  expenses_covered?: boolean;
  /** Подсказка о месте («Аптека рядом ~5 минут»). */
  place_hint?: string;

  // — Поля событий —
  event_date?: string;
  participants?: number;
  capacity?: number;
  image?: string;
}

export type MapEvent =
  | { event: 'TASK_CREATED'; data: TaskMapItem }
  | { event: 'TASK_STATUS_CHANGED'; data: { task_id: string; new_status: TaskStatus } };

export interface LngLat {
  lon: number;
  lat: number;
}
