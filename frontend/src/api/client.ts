import { API_BASE } from '../config';
import type { Task, TaskMapItem } from '../types';
import { getInitData } from '../lib/maxBridge';

/**
 * Ошибка «задачу уже взял другой волонтёр» — бэкенд отвечает 409 Conflict
 * при атомарном захвате (см. code_artifact.md, раздел 6).
 */
export class TaskConflictError extends Error {
  constructor(message = 'К сожалению, эту задачу уже взял другой волонтёр') {
    super(message);
    this.name = 'TaskConflictError';
  }
}

function authHeaders(): HeadersInit {
  const initData = getInitData();
  if (initData) return { Authorization: `Bearer ${initData}` };
  const role = localStorage.getItem('nearby.role') === 'applicant' ? 'APPLICANT' : 'VOLUNTEER';
  return {
    'X-Dev-Max-Id': localStorage.getItem('nearby.maxId') ?? '1',
    'X-Dev-Name': localStorage.getItem('nearby.name') ?? 'Локальный пользователь',
    'X-Dev-Role': role,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 409) throw new TaskConflictError();
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return (await res.json()) as T;
}

/**
 * Задачи в видимой области карты (bbox). Пытается сходить на бэкенд;
 * если бэкенд недоступен — отдаёт демо-данные, чтобы фронт работал автономно.
 */
export async function fetchTasksInBbox(
  bbox?: [number, number, number, number],
  district?: string,
): Promise<{ items: Task[]; source: 'api' }> {
  const params = new URLSearchParams();
  if (bbox) params.set('bbox', bbox.join(','));
  if (district?.trim()) params.set('district', district.trim());
  const items = await request<Task[]>(`/tasks/map?${params.toString()}`);
  return { items: items.map((task) => ({ ...task, kind: task.category === 'PERSONAL_HELP' ? 'home' : 'other' })), source: 'api' };
}

/**
 * Захват задачи волонтёром. Возвращает обновлённую метку.
 * На бэкенде — атомарный UPDATE ... WHERE status='PUBLISHED'.
 */
export async function assignTask(taskId: string): Promise<TaskMapItem> {
  return request<TaskMapItem>(`/tasks/${taskId}/assign`, { method: 'POST' });
}

export async function saveNotificationFilter(city: string, district: string): Promise<void> {
  await request('/notifications/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ city, district: district || null, enabled: true }),
  });
}

export async function listAuthoredTasks(): Promise<Task[]> {
  return request<Task[]>('/tasks/authored');
}

export async function listAssignedTasks(): Promise<Task[]> {
  return request<Task[]>('/tasks/assigned');
}

export async function createAuthoredTask(input: {
  title: string; description: string; category: Task['category']; address_hint: string;
  address_text: string; lat: number; lon: number;
}): Promise<Task> {
  return request<Task>('/tasks', { method: 'POST', body: JSON.stringify({ ...input, photos: [] }) });
}

export async function cancelAuthoredTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/cancel`, { method: 'POST' });
}

export async function closeAuthoredTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}/close`, { method: 'POST' });
}

export async function reviewTask(id: string, score: number, comment?: string, tags: string[] = []): Promise<void> {
  await request(`/tasks/${id}/reviews`, {
    method: 'POST', body: JSON.stringify({ score, tags, comment: comment || null }),
  });
}

export interface ProfileData {
  rating_score: number;
  rating_count: number;
  quality_tags: Record<string, number>;
}

export async function fetchProfile(): Promise<ProfileData> {
  return request<ProfileData>('/me');
}

export async function fetchMonthlyStats(): Promise<Array<{ month: string; participants: number; completed_tasks: number }>> {
  return request('/tasks/stats/monthly');
}
