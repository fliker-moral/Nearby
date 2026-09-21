import { getCurrentUser } from '../lib/maxBridge';
import type { Task } from '../types';
import { FlameIcon, StarIcon, ChevronRightIcon, ClockIcon, HeartIcon } from '../components/icons';

interface ProfileScreenProps {
  tasks: Task[];
}

const ACHIEVEMENTS = [
  { emoji: '💊', title: 'Аптечный помощник', progress: '10/10', done: true },
  { emoji: '❤️', title: 'Всегда рядом', progress: '5/5', done: true },
  { emoji: '📅', title: 'Волонтёр событий', progress: '3/5', done: false },
  { emoji: '🐾', title: 'Друг животных', progress: '2/5', done: false },
  { emoji: '🏠', title: 'Добрые руки', progress: '3/10', done: false },
  { emoji: '🌿', title: 'Экоактивист', progress: '1/5', done: false },
];

export default function ProfileScreen({ tasks }: ProfileScreenProps) {
  const user = getCurrentUser();
  const done = tasks.filter((t) => t.status === 'COMPLETED').length + 27;
  const level = 4;
  const xp = 760;
  const xpMax = 1000;

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
              <span style={{ width: `${(xp / xpMax) * 100}%` }} />
            </div>
            <span className="level-bar__label">
              {level} уровень · {xp}/{xpMax} XP
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
          <b>14 ч</b>
          <span>волонтёрства</span>
        </div>
        <div className="summary-tile">
          <b>4.9</b>
          <span>рейтинг</span>
        </div>
      </div>

      <button className="promo-banner">
        <FlameIcon width={22} height={22} className="promo-banner__flame" />
        <div>
          <b>Вы помогаете людям</b>
          <span>И делаете город добрее</span>
        </div>
        <ChevronRightIcon width={20} height={20} />
      </button>

      <section className="profile-section">
        <div className="section-head">
          <h2>Достижения</h2>
          <button className="section-head__link">
            Все <ChevronRightIcon width={14} height={14} />
          </button>
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
        <h2>Цель сентября — помочь 5 000 людям</h2>
        <div className="challenge__bar">
          <span style={{ width: '77%' }} />
        </div>
        <div className="challenge__meta">
          <span>3 842 / 5 000</span>
          <span className="muted">присоединились 1 245 волонтёров</span>
        </div>
        <div className="challenge__stats">
          <span>
            <HeartIcon width={14} height={14} /> {done} дел
          </span>
          <span>
            <ClockIcon width={14} height={14} /> 14 ч
          </span>
          <span>Топ 12% в городе</span>
        </div>
      </section>

      <p className="profile-foot">
        «Помощь рядом» — забота о пожилых людях силами волонтёров.
      </p>
    </div>
  );
}
