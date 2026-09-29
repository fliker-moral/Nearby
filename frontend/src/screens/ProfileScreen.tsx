import { getCurrentUser } from '../lib/maxBridge';
import { fetchMonthlyStats, fetchProfile, type ProfileData } from '../api/client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '../types';
import { CloseIcon, HeartIcon, StarIcon } from '../components/icons';

interface ProfileScreenProps {
  tasks: Task[];
  onSwitchRole: () => void;
}

const QUALITY_TAGS = [
  ['fast', 'Быстро приехал'],
  ['kindness', 'Вежливость'],
  ['punctuality', 'Пунктуальность'],
  ['carefulness', 'Аккуратность'],
  ['communication', 'Хорошее общение'],
  ['reliability', 'Надёжность'],
] as const;

const achievementInfo = [
  ['🤝', 'Первый шаг', 'Откликнитесь и завершите первую просьбу.', 'Начните с одной небольшой помощи.'],
  ['❤️', 'Всегда рядом', 'Завершите 5 просьб.', 'Пять завершённых дел — уже заметная поддержка для города.'],
  ['💊', 'Аптечный помощник', 'Получите 10 отметок за быстрый отклик.', 'Выбирайте просьбы рядом и заранее оценивайте время в пути.'],
  ['⏰', 'Пунктуальный помощник', 'Получите 5 отметок «Пунктуальность».', 'Подтверждайте время заранее и предупреждайте о задержках.'],
  ['✨', 'Добрые руки', 'Получите 10 отметок «Надёжность».', 'Берите задачи, которые точно сможете выполнить.'],
  ['💬', 'Хорошее общение', 'Получите 5 отметок за общение.', 'Пишите заявителю и держите его в курсе выполнения.'],
] as const;

export default function ProfileScreen({ tasks, onSwitchRole }: ProfileScreenProps) {
  const user = getCurrentUser();
  const done = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED').length;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [month, setMonth] = useState<{ month: string; participants: number; completed_tasks: number } | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<number | null>(null);
  const isAchievementOpen = selectedAchievement !== null;
  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => undefined);
    fetchMonthlyStats().then((items) => setMonth(items[0] ?? null)).catch(() => undefined);
  }, []);

  const tags = profile?.quality_tags ?? {};
  const achievements = achievementInfo.map(([emoji, title, how, motivation], index) => {
    const current = index === 0 ? done : index === 1 ? done : index === 2 ? tags.fast ?? 0 : index === 3 ? tags.punctuality ?? 0 : index === 4 ? tags.reliability ?? 0 : tags.communication ?? 0;
    const target = index === 0 ? 1 : index === 1 ? 5 : index === 2 ? 10 : index === 3 ? 5 : index === 4 ? 10 : 5;
    return { emoji, title, how, motivation, current: Math.min(current, target), target, done: current >= target };
  });
  const modalRoot = typeof document === 'undefined' ? null : document.querySelector('.app');
  const achievementModal = selectedAchievement !== null && modalRoot
    ? createPortal(
        <div className="achievement-modal" role="dialog" aria-modal="true" onClick={() => setSelectedAchievement(null)}>
          <div className="achievement-modal__card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="achievement-modal__close" onClick={() => setSelectedAchievement(null)} aria-label="Закрыть">
              <CloseIcon width={20} height={20} />
            </button>
            <span className="achievement-modal__emoji">{achievements[selectedAchievement].emoji}</span>
            <h2>{achievements[selectedAchievement].title}</h2>
            <p>{achievements[selectedAchievement].how}</p>
            <div className="achievement-modal__progress">
              <span style={{ width: `${(achievements[selectedAchievement].current / achievements[selectedAchievement].target) * 100}%` }} />
            </div>
            <b>{achievements[selectedAchievement].current}/{achievements[selectedAchievement].target}</b>
            <p className="muted">{achievements[selectedAchievement].motivation}</p>
          </div>
        </div>,
        modalRoot,
      )
    : null;

  return (
    <div className={`screen screen--list screen--profile${isAchievementOpen ? ' screen--scroll-locked' : ''}`}>
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
          <b>0</b>
          <span>часов волонтёрства</span>
        </div>
        <div className="summary-tile">
          <b>{profile?.rating_count ? profile.rating_score.toFixed(1) : '0.0'}</b>
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
        <HeartIcon width={22} height={22} className="promo-banner__icon" />
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
          {achievements.map((a, index) => (
            <button type="button" key={a.title} className={`ach${a.done ? ' ach--done' : ''}`} onClick={() => setSelectedAchievement(index)}>
              <span className="ach__emoji">{a.emoji}</span>
              <span className="ach__title">{a.title}</span>
              <span className="ach__progress">{a.current}/{a.target}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="challenge">
        <div className="challenge__top">
          <span className="challenge__badge">Добрая Россия</span>
          <StarIcon width={16} height={16} className="challenge__star" />
        </div>
        <h2>{month ? `Статистика за ${month.month}` : 'Статистика появится после первых заявок'}</h2>
        <p className="challenge__goal">Цель 50000</p>
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
      {achievementModal}
    </div>
  );
}
