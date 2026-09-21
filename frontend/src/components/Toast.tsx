import { useEffect } from 'react';

export interface ToastData {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

export default function Toast({
  toast,
  onDone,
}: {
  toast: ToastData | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.kind}`} role="status">
      {toast.message}
    </div>
  );
}
