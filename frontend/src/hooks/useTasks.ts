import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapEvent, Task, TaskStatus } from '../types';
import { assignTask, fetchTasksInBbox, TaskConflictError } from '../api/client';
import { WS_BASE } from '../config';
import { getInitData } from '../lib/maxBridge';

interface UseTasksResult {
  tasks: Task[];
  source: 'api' | 'mock' | 'loading';
  assign: (task: Task) => Promise<'ok' | 'conflict' | 'error'>;
  patchStatus: (id: string, status: TaskStatus) => void;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [source, setSource] = useState<'api' | 'mock' | 'loading'>('loading');
  const wsRef = useRef<WebSocket | null>(null);

  const patchStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  // Первичная загрузка задач.
  useEffect(() => {
    let alive = true;
    fetchTasksInBbox().then(({ items, source }) => {
      if (!alive) return;
      setTasks(items);
      setSource(source);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Real-time обновления через WebSocket (только если реально подключились).
  useEffect(() => {
    if (source !== 'api' || !WS_BASE) return;
    const token = getInitData();
    const url = `${WS_BASE}/ws/map${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as MapEvent;
        if (msg.event === 'TASK_STATUS_CHANGED') {
          patchStatus(msg.data.task_id, msg.data.new_status);
        }
      } catch {
        /* игнорируем некорректные сообщения */
      }
    };
    ws.onerror = () => ws.close();
    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [source, patchStatus]);

  const assign = useCallback<UseTasksResult['assign']>(
    async (task) => {
      if (source === 'mock') {
        // Demo-режим: имитируем успешный атомарный захват.
        patchStatus(task.id, 'IN_PROGRESS');
        return 'ok';
      }
      // Оптимистично помечаем «в работе», при ошибке откатываем.
      patchStatus(task.id, 'IN_PROGRESS');
      try {
        await assignTask(task.id);
        return 'ok';
      } catch (err) {
        patchStatus(task.id, task.status);
        return err instanceof TaskConflictError ? 'conflict' : 'error';
      }
    },
    [source, patchStatus],
  );

  return { tasks, source, assign, patchStatus };
}
