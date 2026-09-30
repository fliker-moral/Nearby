import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapEvent, Task, TaskStatus } from '../types';
import { assignTask, completeAssignedTask, fetchTasksInBbox, listAssignedTasks, TaskConflictError, withdrawTask } from '../api/client';
import { WS_BASE } from '../config';
import { getInitData } from '../lib/maxBridge';

interface UseTasksResult {
  tasks: Task[];
  source: 'api' | 'loading' | 'error';
  assign: (task: Task, coverLetter: string) => Promise<'ok' | 'conflict' | 'error'>;
  withdraw: (task: Task) => Promise<'ok' | 'error'>;
  complete: (task: Task) => Promise<'ok' | 'error'>;
  patchStatus: (id: string, status: TaskStatus) => void;
}

export function useTasks(city = '', district = ''): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [source, setSource] = useState<'api' | 'loading' | 'error'>('loading');
  const wsRef = useRef<WebSocket | null>(null);

  const patchStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }, []);

  // Первичная загрузка задач.
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchTasksInBbox(undefined, district, city),
      listAssignedTasks().catch(() => []),
    ])
      .then(([{ items, source }, assigned]) => {
        if (!alive) return;
        const byId = new Map([...items, ...assigned].map((task) => [task.id, task]));
        setTasks([...byId.values()]);
        setSource(source);
      })
      .catch(() => {
        if (!alive) return;
        setTasks([]);
        setSource('error');
      });
    return () => {
      alive = false;
    };
  }, [city, district]);

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
        if (msg.event === 'TASK_CREATED') {
          // Одобрённые модератором анкеты должны появляться на карте сразу,
          // а не только после перезагрузки приложения.
          fetchTasksInBbox(undefined, district, city)
            .then(({ items }) => {
              setTasks((current) => {
                const assigned = current.filter((task) => task.status === 'IN_PROGRESS');
                const byId = new Map([...items, ...assigned].map((task) => [task.id, task]));
                return [...byId.values()];
              });
            })
            .catch(() => undefined);
        } else if (msg.event === 'TASK_STATUS_CHANGED') {
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
  }, [source, patchStatus, city, district]);

  const assign = useCallback<UseTasksResult['assign']>(
    async (task, coverLetter) => {
      if (source !== 'api') return 'error';
      // Оптимистично помечаем «в работе», при ошибке откатываем.
      setTasks((prev) => prev.map((item) => item.id === task.id
        ? { ...item, status: 'IN_PROGRESS', assigned_to_me: true, volunteer_message: coverLetter || null }
        : item));
      try {
        await assignTask(task.id, coverLetter);
        return 'ok';
      } catch (err) {
        setTasks((prev) => prev.map((item) => item.id === task.id ? task : item));
        return err instanceof TaskConflictError ? 'conflict' : 'error';
      }
    },
    [source],
  );

  const withdraw = useCallback<UseTasksResult['withdraw']>(async (task) => {
    if (source !== 'api' || !task.assigned_to_me) return 'error';
    setTasks((prev) => prev.map((item) => item.id === task.id
      ? { ...item, status: 'PUBLISHED', assigned_to_me: false, volunteer_message: null }
      : item));
    try {
      await withdrawTask(task.id);
      return 'ok';
    } catch {
      setTasks((prev) => prev.map((item) => item.id === task.id ? task : item));
      return 'error';
    }
  }, [source]);

  const complete = useCallback<UseTasksResult['complete']>(async (task) => {
    if (source !== 'api' || !task.assigned_to_me || task.status !== 'IN_PROGRESS') return 'error';
    setTasks((prev) => prev.map((item) => item.id === task.id ? { ...item, status: 'COMPLETED' } : item));
    try {
      await completeAssignedTask(task.id);
      return 'ok';
    } catch {
      setTasks((prev) => prev.map((item) => item.id === task.id ? task : item));
      return 'error';
    }
  }, [source]);

  return { tasks, source, assign, withdraw, complete, patchStatus };
}
