import { API_BASE } from '../config';
import type { Task, TaskMapItem } from '../types';
import { getInitData } from '../lib/maxBridge';
import { MOCK_TASKS } from '../data/mockData';

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
  return initData ? { Authorization: `Bearer ${initData}` } : {};
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
export async function fetchTasksInBbox(bbox?: [number, number, number, number]): Promise<{
  items: Task[];
  source: 'api' | 'mock';
}> {
  try {
    const qs = bbox ? `?bbox=${bbox.join(',')}` : '';
    const items = await request<Task[]>(`/tasks/map${qs}`);
    return { items, source: 'api' };
  } catch {
    return { items: MOCK_TASKS, source: 'mock' };
  }
}

/**
 * Захват задачи волонтёром. Возвращает обновлённую метку.
 * На бэкенде — атомарный UPDATE ... WHERE status='PUBLISHED'.
 */
export async function assignTask(taskId: string): Promise<TaskMapItem> {
  return request<TaskMapItem>(`/tasks/${taskId}/assign`, { method: 'POST' });
}
