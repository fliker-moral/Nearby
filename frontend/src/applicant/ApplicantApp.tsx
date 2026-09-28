import { useState } from 'react';
import { KIND_META } from '../config';
import { getCurrentUser } from '../lib/maxBridge';
import { useApplicant } from './useApplicant';
import type { MyRequest } from './types';
import CreateRequest from './CreateRequest';
import RequestDetail from './RequestDetail';
import { PlusIcon, ChevronRightIcon, ListIcon, ProfileIcon } from '../components/icons';

const DEFAULT_ADDRESS = 'ул. Ленина, 15, кв. 12';

function statusText(r: MyRequest): { label: string; cls: string } {
  switch (r.status) {
    case 'searching':
      return { label: 'Ищем волонтёра…', cls: 'searching' };
    case 'offer':
      return { label: `Вам готов помочь ${r.volunteer?.name}`, cls: 'offer' };
    case 'in_progress':
      return { label: `${r.volunteer?.name} помогает вам`, cls: 'progress' };
    case 'done':
      return { label: r.reviewed ? 'Выполнено' : 'Выполнено · оцените', cls: 'done' };
  }
}

interface ApplicantAppProps {
  onSwitchRole: () => void;
}

export default function ApplicantApp({ onSwitchRole }: ApplicantAppProps) {
  const app = useApplicant();
  const [tab, setTab] = useState<'home' | 'profile'>('home');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const user = getCurrentUser();

  const open = openId ? app.requests.find((r) => r.id === openId) ?? null : null;
  const offers = app.requests.filter((r) => r.status === 'offer').length;

  return (
    <div className="app app--applicant">
      {tab === 'home' && (
        <div className="screen a-screen">
          <header className="a-header">
            <h1>Здравствуйте!</h1>
            <p>Нужна помощь? Опишите просьбу — рядом есть волонтёры.</p>
          </header>

          <button className="a-create" onClick={() => setCreating(true)}>
            <span className="a-create__ic">
              <PlusIcon width={26} height={26} />
            </span>
            <span className="a-create__text">
              <b>Создать просьбу</b>
              <span>Купить лекарства, продукты, помочь по дому…</span>
            </span>
            <ChevronRightIcon width={22} height={22} />
          </button>

          <h2 className="a-section-title">Ваши просьбы</h2>
          {app.requests.length === 0 ? (
            <div className="a-empty">
              <p>Пока просьб нет</p>
              <span>Нажмите «Создать просьбу», чтобы позвать на помощь</span>
            </div>
          ) : (
            <div className="a-list">
              {app.requests.map((r) => {
                const st = statusText(r);
                return (
                  <button key={r.id} className="a-card" onClick={() => setOpenId(r.id)}>
                    <span className="a-card__emoji">{KIND_META[r.kind]?.emoji}</span>
                    <span className="a-card__body">
                      <span className="a-card__title">{r.title}</span>
                      <span className="a-card__when">🕐 {r.when}</span>
                      <span className={`a-status a-status--${st.cls}`}>
                        {r.status === 'searching' && <span className="a-dot-spin" />}
                        {st.label}
                      </span>
                    </span>
                    <ChevronRightIcon width={22} height={22} className="a-card__chev" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="screen a-screen">
          <header className="a-header">
            <h1>Профиль</h1>
          </header>
          <div className="a-profile-card">
            <div className="avatar avatar--lg">{user.name.charAt(0)}</div>
            <div>
              <b className="a-profile-name">{user.name}</b>
              <span className="a-profile-sub">Заявитель · {DEFAULT_ADDRESS}</span>
            </div>
          </div>
          <button className="a-btn a-btn--switch" onClick={onSwitchRole}>
            🙋 Я волонтёр — перейти на карту помощи
          </button>
          <p className="a-profile-foot">
            «Помощь рядом» — волонтёры помогают пожилым людям с бытовыми делами.
          </p>
        </div>
      )}

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button
          className={`nav-item${tab === 'home' ? ' nav-item--active' : ''}`}
          onClick={() => setTab('home')}
        >
          <span className="nav-item__icon">
            <ListIcon width={26} height={26} />
            {offers ? <span className="nav-item__badge">{offers}</span> : null}
          </span>
          <span className="nav-item__label">Мои просьбы</span>
        </button>
        <button
          className={`nav-item${tab === 'profile' ? ' nav-item--active' : ''}`}
          onClick={() => setTab('profile')}
        >
          <span className="nav-item__icon">
            <ProfileIcon width={26} height={26} />
          </span>
          <span className="nav-item__label">Профиль</span>
        </button>
      </nav>

      {creating && (
        <CreateRequest
          defaultAddress={DEFAULT_ADDRESS}
          onClose={() => setCreating(false)}
          onCreate={(data) => {
            const id = app.createRequest(data);
            setCreating(false);
            setTab('home');
            setOpenId(id);
          }}
        />
      )}

      {open && (
        <RequestDetail
          request={open}
          onClose={() => setOpenId(null)}
          onAccept={app.acceptOffer}
          onDecline={app.declineOffer}
          onComplete={app.completeRequest}
          onReview={app.submitReview}
        />
      )}
    </div>
  );
}
