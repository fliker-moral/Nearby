import { useCallback, useEffect, useState } from 'react';
import type { MyRequest } from './types';
import { cancelAuthoredTask, closeAuthoredTask, createAuthoredTask, listAuthoredTasks, reviewTask } from '../api/client';
import type { Task } from '../types';

const statusOf = (task: Task): MyRequest['status'] =>
  task.status === 'IN_PROGRESS' ? 'in_progress' : task.status === 'COMPLETED' || task.status === 'CLOSED' ? 'done' : 'searching';
const fromTask = (task: Task): MyRequest => ({
  id: task.id, kind: task.kind, title: task.title, description: task.description,
  address: task.address_text ?? task.address_hint, when: new Date(task.created_at).toLocaleString('ru-RU'),
  createdAt: task.created_at, status: statusOf(task), reviewed: false,
});

export function useApplicant() {
  const [requests, setRequests] = useState<MyRequest[]>([]);

  useEffect(() => {
    listAuthoredTasks().then((items) => {
      setRequests(items.map(fromTask));
    }).catch(() => setRequests([]));
  }, []);

  const patch = useCallback((id: string, upd: Partial<MyRequest>) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...upd } : r)));
  }, []);

  const createRequest = useCallback(
    (data: Pick<MyRequest, 'kind' | 'title' | 'description' | 'address' | 'when' | 'lat' | 'lon'>) => {
      const promise = createAuthoredTask({ title: data.title, description: data.description, category: 'PERSONAL_HELP', address_hint: data.address, address_text: data.address, lat: data.lat ?? 55.7512, lon: data.lon ?? 37.6183 });
      promise.then((task) => { setRequests((prev) => [fromTask(task), ...prev]); });
      return `pending-${Date.now()}`;
    },
    [],
  );

  const acceptOffer = useCallback((_id: string) => undefined, []);

  const declineOffer = useCallback(
    (id: string) => {
    patch(id, { status: 'searching' });
    },
    [patch],
  );

  const completeRequest = useCallback((id: string) => {
    closeAuthoredTask(id).then((task) => patch(id, fromTask(task)));
  }, [patch]);

  const submitReview = useCallback((id: string, score: number, tags: string[]) => {
    const mappedTags = tags.flatMap((tag) => {
      if (tag === 'Быстро откликнулся') return ['fast'];
      if (tag === 'Был вежливым') return ['kindness'];
      if (tag === 'Пришёл вовремя') return ['punctuality'];
      if (tag === 'Всё сделал аккуратно') return ['carefulness'];
      if (tag === 'Держал в курсе') return ['communication'];
      if (tag === 'Очень помог') return ['reliability'];
      return [];
    });
    reviewTask(id, score, undefined, mappedTags).then(() => patch(id, { reviewed: true }));
  }, [patch]);

  const cancelRequest = useCallback((id: string) => {
    cancelAuthoredTask(id).then((task) => patch(id, fromTask(task)));
  }, [patch]);

  return {
    requests,
    createRequest,
    acceptOffer,
    declineOffer,
    completeRequest,
    submitReview,
    cancelRequest,
  };
}
