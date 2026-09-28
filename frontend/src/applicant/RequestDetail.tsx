import { useState } from 'react';
import { KIND_META } from '../config';
import type { MyRequest } from './types';
import {
  CheckIcon,
  CheckCircleIcon,
  CloseIcon,
  NavArrowIcon,
  ShieldIcon,
  StarIcon,
  HeartIcon,
} from '../components/icons';

interface RequestDetailProps {
  request: MyRequest;
  onClose: () => void;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onComplete: (id: string) => void;
  onReview: (id: string) => void;
  onReport: (id: string, reason: string) => void;
  onCancel: (id: string) => void;
}

const REVIEW_TAGS = [
  'Быстро откликнулся',
  'Был вежливым',
  'Пришёл вовремя',
  'Всё сделал аккуратно',
  'Держал в курсе',
  'Очень помог',
];

const REPORT_REASONS = [
  'Волонтёр слишком далеко',
  'Не выходит на связь',
  'Грубое поведение',
  'Просит лишние деньги',
  'Не пришёл',
  'Другое',
];

/** Оценка «пешего» времени в пути по расстоянию (5 км/ч круглосуточно). */
function walkEstimate(km: number): string {
  const days = km / 120;
  if (days >= 1) return `~${Math.round(days)} дн. пешком`;
  const hours = Math.round(km / 5);
  return `~${hours} ч пешком`;
}

export default function RequestDetail({
  request: r,
  onClose,
  onAccept,
  onDecline,
  onComplete,
  onReview,
  onReport,
  onCancel,
}: RequestDetailProps) {
  const [view, setView] = useState<'main' | 'report' | 'cancel'>('main');
  const [reviewing, setReviewing] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [score, setScore] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const v = r.volunteer;
  const meta = KIND_META[r.kind];
  const far = v ? v.distance_km > 30 : false;

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const sendReview = () => {
    onReview(r.id);
    setThanked(true);
  };

  return (
    <div className="a-modal">
      <header className="a-modal__head">
        <button className="a-icon-btn" onClick={view === 'main' ? onClose : () => setView('main')}>
          {view === 'main' ? <CloseIcon width={24} height={24} /> : '‹ Назад'}
        </button>
        <span className="a-modal__title">Ваша просьба</span>
        <span className="a-step" />
      </header>

      <div className="a-modal__body">
        {/* Заголовок просьбы */}
        <div className="a-req-head">
          <span className="a-req-emoji">{meta?.emoji}</span>
          <div>
            <h2 className="a-req-title">{r.title}</h2>
            <span className="a-req-when">🕐 {r.when}</span>
          </div>
        </div>

        {/* ── Жалоба ── */}
        {view === 'report' && (
          <>
            <h2 className="a-q">Что не так?</h2>
            <div className="a-reasons">
              {REPORT_REASONS.map((t) => (
                <button
                  key={t}
                  className={`a-reason${reason === t ? ' a-reason--on' : ''}`}
                  onClick={() => setReason(t)}
                >
                  {reason === t ? '● ' : '○ '}
                  {t}
                </button>
              ))}
            </div>
            <button
              className="a-btn a-btn--danger"
              disabled={!reason}
              onClick={() => onReport(r.id, reason)}
            >
              Отправить жалобу
            </button>
            <button className="a-btn a-btn--text" onClick={() => setView('main')}>
              Отмена
            </button>
          </>
        )}

        {/* ── Подтверждение отмены ── */}
        {view === 'cancel' && (
          <div className="a-confirm">
            <div className="a-confirm__ic">⚠️</div>
            <b>Отменить просьбу?</b>
            <span>
              {r.status === 'in_progress'
                ? 'Волонтёр будет освобождён и получит уведомление.'
                : 'Просьба будет удалена. Это действие нельзя отменить.'}
            </span>
            <button className="a-btn a-btn--danger" onClick={() => onCancel(r.id)}>
              Да, отменить просьбу
            </button>
            <button className="a-btn a-btn--text" onClick={() => setView('main')}>
              Нет, оставить
            </button>
          </div>
        )}

        {view === 'main' && (
          <>
            {/* ── Поиск волонтёра ── */}
            {r.status === 'searching' && (
              <>
                <div className="a-searching">
                  <span className="a-spinner" />
                  <b>Ищем волонтёра рядом…</b>
                  <span>Обычно кто-то откликается в течение часа. Мы сообщим, когда найдём.</span>
                </div>
                <button className="a-btn a-btn--text a-btn--danger-text" onClick={() => setView('cancel')}>
                  Отменить просьбу
                </button>
              </>
            )}

            {/* ── Отклик волонтёра ── */}
            {r.status === 'offer' && v && (
              <>
                <div className="a-vol-banner">Вам готов помочь волонтёр</div>
                {far && (
                  <div className="a-warn">
                    ⚠️ Волонтёр далеко — {v.distance_km} км ({v.detail}). {walkEstimate(v.distance_km)}.
                    Лучше отклонить и дождаться, кто рядом.
                  </div>
                )}
                <div className="a-vol">
                  <div className="avatar avatar--lg">{v.name.charAt(0)}</div>
                  <div className="a-vol__info">
                    <span className="a-vol__name">
                      {v.name}, {v.age} года
                    </span>
                    {v.verified ? (
                      <span className="verified-chip">Проверенный волонтёр</span>
                    ) : (
                      <span className="a-unverified">Не проверен</span>
                    )}
                    <span className="a-vol__rating">
                      <StarIcon width={16} height={16} /> {v.rating_score.toFixed(1)} (
                      {v.rating_count})
                    </span>
                  </div>
                </div>
                <div className="a-vol-tiles">
                  <div className="a-vt">
                    <b>{v.done_count}</b>
                    <span>выполнено</span>
                  </div>
                  <div className="a-vt">
                    <b>{v.distance_km < 100 ? `~${v.distance_km} км` : `${v.distance_km} км`}</b>
                    <span>{far ? 'далеко!' : 'рядом'}</span>
                  </div>
                  <div className="a-vt">
                    <b>{v.detail.split(' ')[0]}</b>
                    <span>{v.detail.split(' ').slice(1).join(' ')}</span>
                  </div>
                </div>
                <div className="a-msg">«{v.message}»</div>
                <div className="a-note">
                  <ShieldIcon width={18} height={18} /> После согласия волонтёр получит ваш телефон и
                  адрес, чтобы связаться в MAX.
                </div>
                <button className="a-btn a-btn--primary" onClick={() => onAccept(r.id)}>
                  <CheckIcon width={22} height={22} /> Принять помощь
                </button>
                <button className="a-btn a-btn--ghost-danger" onClick={() => onDecline(r.id)}>
                  Отклонить и искать дальше
                </button>
                <div className="a-secondary">
                  <button onClick={() => setView('report')}>Пожаловаться</button>
                  <button onClick={() => setView('cancel')}>Отменить просьбу</button>
                </div>
              </>
            )}

            {/* ── Волонтёр в работе ── */}
            {r.status === 'in_progress' && v && (
              <>
                <div className="a-vol a-vol--accepted">
                  <div className="avatar avatar--lg">{v.name.charAt(0)}</div>
                  <div className="a-vol__info">
                    <span className="a-vol__name">{v.name} помогает вам</span>
                    <span className="a-vol__rating">
                      <StarIcon width={16} height={16} /> {v.rating_score.toFixed(1)} · {v.detail}
                    </span>
                  </div>
                </div>
                <div className="a-note a-note--ok">
                  <NavArrowIcon width={18} height={18} /> Свяжитесь с волонтёром в MAX, чтобы уточнить
                  детали. Когда всё будет готово — отметьте, что просьба выполнена.
                </div>
                <button className="a-btn a-btn--primary" onClick={() => onComplete(r.id)}>
                  <CheckCircleIcon width={22} height={22} /> Просьба выполнена
                </button>
                <div className="a-secondary">
                  <button onClick={() => setView('report')}>Пожаловаться на волонтёра</button>
                  <button onClick={() => setView('cancel')}>Отменить просьбу</button>
                </div>
              </>
            )}

            {/* ── Выполнено: оценка ── */}
            {r.status === 'done' && v && !thanked && !r.reviewed && !reviewing && (
              <div className="a-done">
                <div className="a-done__badge">
                  <CheckIcon width={40} height={40} />
                </div>
                <b>Спасибо! Просьба выполнена</b>
                <span>{v.name} выполнил вашу просьбу. Оцените помощь — это важно для волонтёра.</span>
                <button className="a-btn a-btn--primary" onClick={() => setReviewing(true)}>
                  Оценить помощь
                </button>
                <button className="a-btn a-btn--text" onClick={onClose}>
                  Позже
                </button>
              </div>
            )}

            {/* Форма отзыва */}
            {r.status === 'done' && v && reviewing && !thanked && (
              <div className="a-review">
                <b className="a-review__q">Как всё прошло?</b>
                <div className="a-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={`a-star${n <= score ? ' a-star--on' : ''}`}
                      onClick={() => setScore(n)}
                      aria-label={`${n} звёзд`}
                    >
                      <StarIcon width={38} height={38} />
                    </button>
                  ))}
                </div>
                <b className="a-review__q">Что понравилось?</b>
                <div className="a-chips">
                  {REVIEW_TAGS.map((t) => (
                    <button
                      key={t}
                      className={`a-when${tags.includes(t) ? ' a-when--on' : ''}`}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button className="a-btn a-btn--primary" onClick={sendReview}>
                  Отправить отзыв
                </button>
                {score <= 2 && (
                  <button className="a-btn a-btn--text a-btn--danger-text" onClick={() => setView('report')}>
                    Пожаловаться на волонтёра
                  </button>
                )}
              </div>
            )}

            {/* Спасибо за отзыв / уже оценено */}
            {r.status === 'done' && (thanked || r.reviewed) && (
              <div className="a-done">
                <div className="a-done__badge a-done__badge--heart">
                  <HeartIcon width={40} height={40} />
                </div>
                <b>Спасибо за отзыв!</b>
                <span>Вы помогаете делать помощь лучше и добрее 💙</span>
                <button className="a-btn a-btn--primary" onClick={onClose}>
                  Готово
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
