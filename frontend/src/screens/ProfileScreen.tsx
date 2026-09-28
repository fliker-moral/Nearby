import { getCurrentUser } from '../lib/maxBridge';
import { fetchMonthlyStats, fetchProfile, type ProfileData } from '../api/client';
import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { FlameIcon, StarIcon } from '../components/icons';

interface ProfileScreenProps {
  tasks: Task[];
  onSwitchRole: () => void;
}

const ACHIEVEMENTS = [
  { emoji: '💊', title: 'Аптечный помощник', progress: '10/10', done: true },
  { emoji: '❤️', title: 'Всегда рядом', progress: '5/5', done: true },
  { emoji: '📅', title: 'Волонтёр событий', progress: '3/5', done: false },
  { emoji: '🐾', title: 'Друг животных', progress: '2/5', done: false },
  { emoji: '🏠', title: 'Добрые руки', progress: '3/10', done: false },
  { emoji: '🌿', title: 'Экоактивист', progress: '1/5', done: false },
];

const QUALITY_TAGS = [
  ['fast', 'Быстро приехал'],
  ['kindness', 'Вежливость'],
  ['punctuality', 'Пунктуальность'],
  ['carefulness', 'Аккуратность'],
  ['communication', 'Хорошее общение'],
  ['reliability', 'Надёжность'],
] as const;

export default function ProfileScreen({ tasks, onSwitchRole }: ProfileScreenProps) {
  const user = getCurrentUser();
  const done = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [month, setMonth] = useState<{ month: string; participants: number; completed_tasks: number } | null>(null);
  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => undefined);
    fetchMonthlyStats().then((items) => setMonth(items[0] ?? null)).catch(() => undefined);
  }, []);

  return (
    <div className="screen screen--list screen--profile">
      <header className="profile-hero">
        <div className="avatar avatar--lg" aria-hidden>
          {user.name.charAt(0)}
        </div>
        <div className="profile-hero__info">
          <h1>
            {user.name} <span className="verified">✓</span>
          </h1>
          <span className="profile-role">Надёжный помощник</span>
          <div className="level-bar">
            <div className="level-bar__track">
              <span style={{ width: `${Math.min(done * 10, 100)}%` }} />
            </div>
            <span className="level-bar__label">
              {done > 0 ? `${done} выполнено` : 'Новый волонтёр'}
            </span>
          </div>
        </div>
      </header>

      <div className="summary-row">
        <div className="summary-tile">
          <b>{done}</b>
          <span>добрых дел</span>
        </div>
        <div className="summary-tile">
          <b>—</b>
          <span>часов волонтёрства</span>
        </div>
        <div className="summary-tile">
          <b>{profile?.rating_count ? profile.rating_score.toFixed(1) : '—'}</b>
          <span>рейтинг</span>
        </div>
      </div>

      <section className="quality-section" aria-label="Отметки от людей">
        <div className="section-head">
          <h2>Отметки от людей</h2>
          <span className="muted">{profile?.rating_count ?? 0} отзывов</span>
        </div>
        <div className="quality-list">
          {QUALITY_TAGS.map(([key, label]) => (
            <div className="quality-item" key={key}>
              <span>{label}</span>
              <b>{profile?.quality_tags?.[key] ?? 0}</b>
            </div>
          ))}
        </div>
      </section>

      <div className="promo-banner">
        <FlameIcon width={22} height={22} className="promo-banner__flame" />
        <div>
          <b>Вы помогаете людям</b>
          <span>И делаете город добрее</span>
        </div>
      </div>

      <section className="profile-section">
        <div className="section-head">
          <h2>Достижения</h2>
        </div>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.title} className={`ach${a.done ? ' ach--done' : ''}`}>
              <span className="ach__emoji">{a.emoji}</span>
              <span className="ach__title">{a.title}</span>
              <span className="ach__progress">{a.progress}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="challenge">
        <div className="challenge__top">
          <span className="challenge__badge">Добрая Москва</span>
          <StarIcon width={16} height={16} className="challenge__star" />
        </div>
        <h2>{month ? `Статистика за ${month.month}` : 'Статистика появится после первых заявок'}</h2>
        <div className="challenge__bar">
          <span style={{ width: month ? '100%' : '0%' }} />
        </div>
        <div className="challenge__meta">
          <span>{month?.completed_tasks ?? 0} выполнено</span>
          <span className="muted">участников: {month?.participants ?? 0}</span>
        </div>
      </section>

      <button className="btn btn--switch-role" onClick={onSwitchRole}>
        👵 Мне нужна помощь — перейти в режим заявителя
      </button>

      <p className="profile-foot">
        «Помощь рядом» — забота о пожилых людях силами волонтёров.
      </p>
    </div>
  );
}
