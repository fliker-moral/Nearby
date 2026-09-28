import { useCallback, useEffect, useRef, useState } from 'react';
import type { MyRequest } from './types';
import { INITIAL_REQUESTS, VOLUNTEERS } from './data';

const KEY = 'nearby.applicant.requests';

function load(): MyRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MyRequest[];
  } catch {
    /* ignore */
  }
  return INITIAL_REQUESTS;
}

function save(list: MyRequest[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function randomVolunteer() {
  return VOLUNTEERS[Math.floor(Math.random() * VOLUNTEERS.length)];
}

export function useApplicant() {
  const [requests, setRequests] = useState<MyRequest[]>(load);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => save(requests), [requests]);

  const patch = useCallback((id: string, upd: Partial<MyRequest>) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...upd } : r)));
  }, []);

  /** Имитируем, что через несколько секунд находится волонтёр. */
  const scheduleMatch = useCallback(
    (id: string) => {
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id && r.status === 'searching'
              ? { ...r, status: 'offer', volunteer: randomVolunteer() }
              : r,
          ),
        );
      }, 3500);
    },
    [],
  );

  // При старте подберём волонтёра для всех «ищущих» просьб.
  useEffect(() => {
    requests.forEach((r) => {
      if (r.status === 'searching') scheduleMatch(r.id);
    });
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRequest = useCallback(
    (data: Pick<MyRequest, 'kind' | 'title' | 'description' | 'address' | 'when'>) => {
      const id = `r${Date.now()}`;
      const req: MyRequest = {
        id,
        ...data,
        createdAt: new Date().toISOString(),
        status: 'searching',
      };
      setRequests((prev) => [req, ...prev]);
      scheduleMatch(id);
      return id;
    },
    [scheduleMatch],
  );

  const acceptOffer = useCallback((id: string) => patch(id, { status: 'in_progress' }), [patch]);

  const declineOffer = useCallback(
    (id: string) => {
      patch(id, { status: 'searching', volunteer: undefined });
      scheduleMatch(id);
    },
    [patch, scheduleMatch],
  );

  const completeRequest = useCallback((id: string) => patch(id, { status: 'done' }), [patch]);

  const submitReview = useCallback((id: string) => patch(id, { reviewed: true }), [patch]);

  const cancelRequest = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

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
