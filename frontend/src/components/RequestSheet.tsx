import { useRef, useState } from 'react';
import { STATUS_META } from '../config';
import type { LngLat, Task } from '../types';
import { distanceMeters, formatDistance, formatEta } from '../lib/geo';
import {
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  NavArrowIcon,
  PinIcon,
  RouteIcon,
  ShieldIcon,
  StarIcon,
  WalletIcon,
  CheckIcon,
} from './icons';

interface RequestSheetProps {
  task: Task;
  userLocation: LngLat | null;
  expanded: boolean;
  assigning: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onDismiss: () => void;
  onAssign: (task: Task) => void;
  onRoute: (task: Task) => void;
  routing: boolean;
}

function authorLine(t: Task): string {
  return t.author.age ? `${t.author.name}, ${t.author.age} года` : t.author.name;
}

export default function RequestSheet({
  task,
  userLocation,
  expanded,
  assigning,
  onToggleExpand,
  onClose,
  onDismiss,
  onAssign,
  onRoute,
  routing,
}: RequestSheetProps) {
  const status = STATUS_META[task.status];
  const available = task.status === 'PUBLISHED';
  const mine = task.status === 'IN_PROGRESS';

  // Свайп вниз: в свёрнутом виде — убрать карточку, в развёрнутом — свернуть.
  const startY = useRef<number | null>(null);
  const moved = useRef(false);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);

  const onPointerDown = (e: React.PointerEvent) => {
    // Не начинаем свайп с интерактивных элементов (кнопки, шеврон).
    const t = e.target as HTMLElement;
    if (t.closest('.btn') || t.closest('.req-chevron') || t.closest('.sheet__close')) {
      startY.current = null;
      return;
    }
    startY.current = e.clientY;
    moved.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    if (dy > 4) {
      moved.current = true;
      e.preventDefault();
      e.stopPropagation();
    }
    if (dy > 0) {
      dragYRef.current = dy;
      setDragY(dy);
    }
  };
  const onPointerUp = () => {
    if (startY.current == null) return;
    const dy = dragYRef.current;
    startY.current = null;
    dragYRef.current = 0;
    setDragY(0);
    if (dy > 80) {
      if (expanded) onToggleExpand();
      else onDismiss();
    }
  };
  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };

  const distM =
    task.distance_m ??
    (userLocation ? distanceMeters(userLocation, { lon: task.lon, lat: task.lat }) : null);

  const primary = mine ? (
    <button className="btn btn--done">
      <CheckIcon width={20} height={20} /> Задача у вас
    </button>
  ) : available ? (
    <button className="btn btn--coral" disabled={assigning} onClick={() => onAssign(task)}>
      {assigning ? 'Откликаюсь…' : 'Откликнуться'}
    </button>
  ) : (
    <button className="btn btn--muted" disabled>
      {status.label}
    </button>
  );

  return (
    <>
      {expanded && <div className="sheet-backdrop" onClick={onToggleExpand} />}
      <div
        className={`sheet${expanded ? ' sheet--expanded' : ''}`}
        role="dialog"
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        {...(!expanded ? dragHandlers : {})}
      >
        <button
          className="sheet__grabber-btn"
          onClick={() => {
            if (!moved.current) onToggleExpand();
          }}
          {...(expanded ? dragHandlers : {})}
          aria-label="Свернуть или убрать"
        >
          <span className="sheet__grabber" />
        </button>
        {expanded && (
          <button className="sheet__close" onClick={onClose} aria-label="Закрыть">
            <CloseIcon width={20} height={20} />
          </button>
        )}

        {/* Автор */}
        <div className="req-author">
          <div className="avatar" aria-hidden>
            {task.author.name.charAt(0)}
          </div>
          <div className="req-author__info">
            <span className="req-author__name">
              {authorLine(task)}
              {task.author.verified && <span className="verified" title="Проверенный">✓</span>}
            </span>
            <span className="rating-pill">
              <StarIcon width={13} height={13} /> {task.author.rating_score.toFixed(1)}
              <span className="muted"> ({task.author.rating_count})</span>
            </span>
          </div>
          {!expanded ? (
            <button className="req-chevron" onClick={onToggleExpand} aria-label="Подробнее">
              <ChevronRightIcon width={20} height={20} />
            </button>
          ) : (
            task.author.verified && <span className="verified-chip">Проверенный пользователь</span>
          )}
        </div>

        <h2 className="req-title">{task.title}</h2>
        <p className={`req-desc${expanded ? '' : ' req-desc--clamp'}`}>{task.description}</p>

        {!expanded ? (
          <div className="req-meta">
            {(task.eta_minutes || true) && (
              <span className="req-meta__item req-meta__item--time">
                <ClockIcon width={16} height={16} /> Сегодня, до 18:00
              </span>
            )}
            {distM != null && (
              <span className="req-meta__item">
                <NavArrowIcon width={15} height={15} /> {formatDistance(distM)} от вас
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="tiles">
              <div className="tile">
                <ClockIcon width={18} height={18} className="tile__ic tile__ic--coral" />
                <b>Сегодня, до 18:00</b>
                <span>Желательное время</span>
              </div>
              <div className="tile">
                <NavArrowIcon width={17} height={17} className="tile__ic" />
                <b>{distM != null ? `${formatDistance(distM)} от вас` : 'Рядом'}</b>
                <span>{task.address_text}</span>
              </div>
              {task.place_hint && (
                <div className="tile">
                  <PinIcon width={17} height={17} className="tile__ic" />
                  <b>{task.place_hint.split('·')[0].trim()}</b>
                  <span>{task.place_hint.split('·')[1]?.trim() ?? ''}</span>
                </div>
              )}
              {task.eta_minutes && (
                <div className="tile">
                  <ClockIcon width={17} height={17} className="tile__ic" />
                  <b>~{formatEta(task.eta_minutes)}</b>
                  <span>Примерно займёт</span>
                </div>
              )}
              {task.expenses_covered && (
                <div className="tile">
                  <WalletIcon width={17} height={17} className="tile__ic" />
                  <b>Расходы возмещаются</b>
                  <span>Чек будет оплачен</span>
                </div>
              )}
              {task.reward_xp && (
                <div className="tile">
                  <StarIcon width={17} height={17} className="tile__ic tile__ic--gold" />
                  <b>+{task.reward_xp} XP</b>
                  <span>За выполнение</span>
                </div>
              )}
            </div>

            <div className="privacy-banner">
              <ShieldIcon width={20} height={20} />
              <div>
                <b>Контактные данные откроются после отклика</b>
                <span>Это защищает пользователей</span>
              </div>
            </div>

            <button className="btn btn--route" disabled={routing} onClick={() => onRoute(task)}>
              <RouteIcon width={20} height={20} />
              {routing ? 'Строю маршрут…' : 'Построить пеший маршрут'}
            </button>
          </>
        )}

        <div className="req-actions">
          {!expanded && (
            <button className="btn btn--ghost" onClick={onToggleExpand}>
              Подробнее
            </button>
          )}
          {primary}
        </div>
      </div>
    </>
  );
}
