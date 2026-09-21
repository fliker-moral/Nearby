import { getCurrentUser, isInsideMax } from '../lib/maxBridge';
import type { Task } from '../types';
import { StarIcon } from '../components/icons';

interface ProfileScreenProps {
  tasks: Task[];
}

/** Профиль волонтёра: рейтинг, качественные теги, статистика помощи. */
export default function ProfileScreen({ tasks }: ProfileScreenProps) {
  const user = getCurrentUser();
  const done = tasks.filter((t) => t.status === 'COMPLETED').length;
  const active = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const points = tasks
    .filter((t) => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED')
    .reduce((s, t) => s + (t.reward_points ?? 0), 0);

  const qualityTags: Record<string, number> = {
    Отзывчивость: 14,
    Пунктуальность: 11,
    Доброта: 9,
  };

  return (
    <div className="screen screen--list">
      <header className="profile-hero">
        <div className="avatar avatar--lg" aria-hidden>
          {user.name.charAt(0)}
        </div>
        <div>
          <h1>{user.name}</h1>
          <span className="profile-role">
            Волонтёр{isInsideMax() ? '' : ' · demo'}
          </span>
          <span className="profile-rating">
            <StarIcon width={16} height={16} /> 4,9 <span className="muted">· 27 отзывов</span>
          </span>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <b>{done}</b>
          <span>выполнено</span>
        </div>
        <div className="stat">
          <b>{active}</b>
          <span>в работе</span>
        </div>
        <div className="stat">
          <b>{points}</b>
          <span>баллов</span>
        </div>
      </div>

      <section className="profile-section">
        <h2>Качества</h2>
        <div className="chips chips--static">
          {Object.entries(qualityTags).map(([tag, n]) => (
            <span key={tag} className="chip chip--tag">
              {tag} <span className="chip__count">{n}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2>Уровень волонтёра</h2>
        <div className="level">
          <div className="level__bar">
            <span style={{ width: '68%' }} />
          </div>
          <div className="level__meta">
            <span>Уровень 4 · «Наставник двора»</span>
            <span className="muted">до следующего — 3 задачи</span>
          </div>
        </div>
      </section>

      <p className="profile-foot">
        «Рядом» — помощь пожилым людям силами школьников-волонтёров.
      </p>
    </div>
  );
}
