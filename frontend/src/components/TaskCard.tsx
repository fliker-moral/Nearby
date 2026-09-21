import { KIND_META, MODE_COLOR, STATUS_META } from '../config';
import type { Task } from '../types';
import { formatDistance } from '../lib/geo';
import { ClockIcon, PinIcon } from './icons';

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
}

export default function TaskCard({ task, onOpen }: TaskCardProps) {
  const meta = KIND_META[task.kind];
  const status = STATUS_META[task.status];
  const color = MODE_COLOR[meta ? meta.mode : 'help'];

  return (
    <button className="task-card" onClick={() => onOpen(task)}>
      <span className="task-card__glyph" style={{ background: color }}>
        {meta?.emoji ?? '📍'}
      </span>
      <span className="task-card__body">
        <span className="task-card__title">{task.title}</span>
        <span className="task-card__sub">
          <PinIcon width={14} height={14} /> {task.address_text}
        </span>
        <span className="task-card__meta">
          <span className="task-card__status" style={{ color: status.color }}>
            ● {status.label}
          </span>
          {task.eta_minutes && (
            <span>
              <ClockIcon width={13} height={13} /> {task.eta_minutes} мин
            </span>
          )}
          {task.distance_m != null && <span>{formatDistance(task.distance_m)}</span>}
        </span>
      </span>
    </button>
  );
}
