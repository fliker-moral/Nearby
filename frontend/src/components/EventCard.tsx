import { KIND_META } from '../config';
import type { Task } from '../types';
import { CalendarIcon, PinIcon, UsersIcon } from './icons';

interface EventCardProps {
  event: Task;
  onOpen: (e: Task) => void;
}

export default function EventCard({ event, onOpen }: EventCardProps) {
  const meta = KIND_META[event.kind];
  return (
    <button className="event-card" onClick={() => onOpen(event)}>
      <div
        className="event-card__img"
        style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
      >
        {!event.image && <span className="event-card__emoji">{meta?.emoji}</span>}
      </div>
      <div className="event-card__body">
        <div className="event-card__top">
          <span className="event-tag">{meta?.label}</span>
        </div>
        <span className="event-card__title">{event.title}</span>
        <span className="event-card__desc">{event.description}</span>
        <div className="event-card__meta">
          <span>
            <CalendarIcon width={14} height={14} /> {event.event_date}
          </span>
          <span>
            <PinIcon width={14} height={14} /> {event.address_text}
          </span>
          <span>
            <UsersIcon width={14} height={14} /> {event.participants}/{event.capacity}
          </span>
        </div>
      </div>
    </button>
  );
}
