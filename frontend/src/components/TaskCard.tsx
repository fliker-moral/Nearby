import { CATEGORY_META, STATUS_META } from '../config';
import type { LngLat, Task } from '../types';
import { distanceMeters, formatDistance, formatEta } from '../lib/geo';
import { ClockIcon, PinIcon } from './icons';

interface TaskCardProps {
  task: Task;
  userLocation: LngLat | null;
  onOpen: (task: Task) => void;
}

export default function TaskCard({ task, userLocation, onOpen }: TaskCardProps) {
  const cat = CATEGORY_META[task.category];
  const status = STATUS_META[task.status];
  const dist =
    userLocation && distanceMeters(userLocation, { lon: task.lon, lat: task.lat });

  return (
    <button className="task-card" onClick={() => onOpen(task)}>
      <span className="task-card__glyph" style={{ background: cat.color }}>
        {cat.emoji}
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
              <ClockIcon width={13} height={13} /> {formatEta(task.eta_minutes)}
            </span>
          )}
          {dist != null && <span>{formatDistance(dist)}</span>}
        </span>
      </span>
    </button>
  );
}
