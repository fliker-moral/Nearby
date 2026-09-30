import { useCallback, useEffect, useState } from 'react';
import type { MyRequest } from './types';
import { cancelAuthoredTask, closeAuthoredTask, createAuthoredTask, listAuthoredTasks, reviewTask } from '../api/client';
import type { Task } from '../types';

const statusOf = (task: Task): MyRequest['status'] =>
  task.status === 'PENDING_MODERATION' ? 'moderation'
    : task.status === 'REJECTED' ? 'rejected'
      : task.status === 'IN_PROGRESS' ? 'in_progress'
        : task.status === 'COMPLETED' || task.status === 'CLOSED' ? 'done'
          : 'searching';
const fromTask = (task: Task): MyRequest => ({
  id: task.id, kind: task.kind, title: task.title, description: task.description,
  address: task.address_text ?? task.address_hint, when: task.schedule_text ?? 'Время не указано',
  createdAt: task.created_at, status: statusOf(task), reviewed: task.reviewed_by_author ?? false,
  volunteer: task.volunteer ? {
    ...task.volunteer,
    message: task.volunteer_message ?? '',
  } : undefined,
});

export function useApplicant() {
  const [requests, setRequests] = useState<MyRequest[]>([]);

  const refreshRequests = useCallback(async () => {
    try {
      const items = await listAuthoredTasks();
      setRequests(items.map(fromTask));
    } catch {
      // Keep the last successfully loaded requests while the API is unavailable.
    }
  }, []);

  useEffect(() => {
    void refreshRequests();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshRequests();
    };
    const interval = window.setInterval(refreshWhenVisible, 10_000);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [refreshRequests]);

  const patch = useCallback((id: string, upd: Partial<MyRequest>) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...upd } : r)));
  }, []);

  const createRequest = useCallback(
    async (data: Pick<MyRequest, 'kind' | 'title' | 'description' | 'address' | 'when' | 'lat' | 'lon'>): Promise<MyRequest> => {
      const task = await createAuthoredTask({
        title: data.title,
        description: data.description,
        category: 'PERSONAL_HELP',
        address_hint: data.address,
        address_text: data.address,
        schedule_text: data.when,
        lat: data.lat ?? 55.7512,
        lon: data.lon ?? 37.6183,
      });
      const created = fromTask(task);
      setRequests((prev) => [created, ...prev]);
      return created;
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

  const submitReview = useCallback(async (id: string, score: number, tags: string[]) => {
    const mappedTags = tags.flatMap((tag) => {
      if (tag === 'Быстро откликнулся') return ['fast'];
      if (tag === 'Был вежливым') return ['kindness'];
      if (tag === 'Пришёл вовремя') return ['punctuality'];
      if (tag === 'Всё сделал аккуратно') return ['carefulness'];
      if (tag === 'Держал в курсе') return ['communication'];
      if (tag === 'Очень помог') return ['reliability'];
      return [];
    });
    await reviewTask(id, score, undefined, mappedTags);
    patch(id, { reviewed: true });
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
