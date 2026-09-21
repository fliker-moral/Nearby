// Типы синхронизированы с бэкендом (app/models/enums.py, app/schemas/*).

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

/** Автор заявки (пожилой человек / организация) — соответствует schemas.UserRead. */
export interface TaskAuthor {
  id: string;
  name: string;
  avatar_url: string | null;
  rating_score: number;
  rating_count: number;
}

/** Полная карточка задачи — соответствует schemas.TaskRead + автор. */
export interface Task extends TaskMapItem {
  description: string;
  address_text: string;
  photos: string[];
  author: TaskAuthor;
  created_at: string;
  /** Условная «награда» в баллах волонтёра — только для UI-геймификации. */
  reward_points?: number;
  /** Оценка длительности задачи в минутах — только для UI. */
  eta_minutes?: number;
}

/** События WebSocket-канала /api/v1/ws/map. */
export type MapEvent =
  | { event: 'TASK_CREATED'; data: TaskMapItem }
  | { event: 'TASK_STATUS_CHANGED'; data: { task_id: string; new_status: TaskStatus } };

export interface LngLat {
  lon: number;
  lat: number;
}
