import { CATEGORY_META, STATUS_META } from '../config';
import type { LngLat, Task } from '../types';
import { distanceMeters, formatDistance, formatEta } from '../lib/geo';
import {
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  PinIcon,
  RouteIcon,
  StarIcon,
} from './icons';

interface TaskSheetProps {
  task: Task;
  userLocation: LngLat | null;
  isFavorite: boolean;
  assigning: boolean;
  onClose: () => void;
  onAssign: (task: Task) => void;
  onToggleFavorite: (task: Task) => void;
  onRoute: (task: Task) => void;
}

export default function TaskSheet({
  task,
  userLocation,
  isFavorite,
  assigning,
  onClose,
  onAssign,
  onToggleFavorite,
  onRoute,
}: TaskSheetProps) {
  const cat = CATEGORY_META[task.category];
  const status = STATUS_META[task.status];
  const available = task.status === 'PUBLISHED';
  const mine = task.status === 'IN_PROGRESS';

  const dist =
    userLocation && distanceMeters(userLocation, { lon: task.lon, lat: task.lat });

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={task.title}>
        <div className="sheet__grabber" />
        <button className="sheet__close" onClick={onClose} aria-label="Закрыть">
          <CloseIcon width={20} height={20} />
        </button>

        <div className="sheet__head">
          <span className="sheet__cat" style={{ background: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
          <span className="sheet__status" style={{ color: status.color }}>
            ● {status.label}
          </span>
        </div>

        <h2 className="sheet__title">{task.title}</h2>

        <div className="sheet__meta">
          {dist != null && (
            <span className="meta-pill">
              <PinIcon width={16} height={16} /> {formatDistance(dist)}
            </span>
          )}
          {task.eta_minutes && (
            <span className="meta-pill">
              <ClockIcon width={16} height={16} /> {formatEta(task.eta_minutes)}
            </span>
          )}
          {task.reward_points && (
            <span className="meta-pill meta-pill--reward">+{task.reward_points} баллов</span>
          )}
        </div>

        <p className="sheet__desc">{task.description}</p>

        <div className="sheet__address">
          <PinIcon width={18} height={18} />
          <span>{task.address_text}</span>
        </div>

        <div className="sheet__author">
          <div className="avatar" aria-hidden>
            {task.author.name.charAt(0)}
          </div>
          <div className="sheet__author-info">
            <span className="sheet__author-name">{task.author.name}</span>
            <span className="sheet__author-rating">
              <StarIcon width={14} height={14} /> {task.author.rating_score.toFixed(1)}
              <span className="muted"> · {task.author.rating_count} отзывов</span>
            </span>
          </div>
        </div>

        <div className="sheet__actions">
          <button
            className={`icon-btn${isFavorite ? ' icon-btn--on' : ''}`}
            onClick={() => onToggleFavorite(task)}
            aria-label="В избранное"
          >
            <BookmarkIcon width={22} height={22} />
          </button>
          <button className="icon-btn" onClick={() => onRoute(task)} aria-label="Маршрут">
            <RouteIcon width={22} height={22} />
          </button>

          {available && (
            <button
              className="btn-primary"
              disabled={assigning}
              onClick={() => onAssign(task)}
            >
              {assigning ? 'Беру…' : 'Взять задачу'}
            </button>
          )}
          {mine && (
            <button className="btn-primary btn-primary--done">
              <CheckIcon width={20} height={20} /> Задача у вас
            </button>
          )}
          {!available && !mine && (
            <button className="btn-primary" disabled>
              {status.label}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
