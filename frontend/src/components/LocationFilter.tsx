import { useEffect, useState } from 'react';
import { PinIcon } from './icons';

export interface UserLocationFilter {
  city: string;
  district: string;
}

interface LocationFilterProps {
  location: UserLocationFilter;
  notificationsEnabled: boolean;
  onLocationChange: (location: UserLocationFilter) => Promise<void>;
  onToggleNotifications: (enabled: boolean) => Promise<void>;
}

export default function LocationFilter({
  location,
  notificationsEnabled,
  onLocationChange,
  onToggleNotifications,
}: LocationFilterProps) {
  const [editing, setEditing] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [city, setCity] = useState(location.city);
  const [district, setDistrict] = useState(location.district);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCity(location.city);
    setDistrict(location.district);
  }, [location.city, location.district]);

  const saveLocation = async () => {
    const next = { city: city.trim(), district: district.trim() };
    if (!next.city || busy) return;
    setBusy(true);
    setError('');
    try {
      await onLocationChange(next);
      setEditing(false);
      setPromptOpen(true);
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== 'Failed to fetch' ? cause.message : 'Не удалось сохранить локацию. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const toggleNotifications = async () => {
    setBusy(true);
    setError('');
    try {
      await onToggleNotifications(!notificationsEnabled);
      setPromptOpen(false);
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== 'Failed to fetch' ? cause.message : 'Не удалось изменить подписку. Проверьте подключение к серверу.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="location-filter-wrap">
      <button type="button" className="location-filter" onClick={() => setEditing((open) => !open)}>
        <PinIcon width={20} height={20} />
        <span>{location.city ? [location.city, location.district].filter(Boolean).join(', ') : 'Выберите город или район'}</span>
        <span className="location-filter__chevron" aria-hidden="true">⌄</span>
      </button>

      {location.city && (
        <button type="button" className="filter-notify" onClick={() => setPromptOpen(true)}>
          🔔 {notificationsEnabled ? 'Уведомления включены' : 'Уведомлять о новых просьбах в этом районе'}
        </button>
      )}

      {editing && (
        <div className="location-editor">
          <label>
            Город
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Например, Москва" autoComplete="address-level2" />
          </label>
          <label>
            Район <span className="location-editor__optional">необязательно</span>
            <input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Например, Тверской" autoComplete="address-level3" />
          </label>
          {error && <span className="location-editor__error" role="alert">{error}</span>}
          <div className="location-editor__actions">
            <button type="button" onClick={() => { setEditing(false); setError(''); }}>Отмена</button>
            <button type="button" disabled={!city.trim() || busy} onClick={saveLocation}>{busy ? 'Сохраняем…' : 'Сохранить'}</button>
          </div>
        </div>
      )}

      {promptOpen && (
        <div className="notification-dialog-backdrop" role="presentation" onClick={() => { if (!busy) setPromptOpen(false); }}>
          <section className="notification-dialog" role="dialog" aria-modal="true" aria-labelledby="notification-dialog-title" onClick={(event) => event.stopPropagation()}>
            <span className="notification-dialog__icon" aria-hidden="true">🔔</span>
            <h2 id="notification-dialog-title">{notificationsEnabled ? 'Уведомления включены' : 'Новые просьбы рядом'}</h2>
            <p>
              {notificationsEnabled
                ? `MAX-бот сообщает о новых просьбах в ${[location.district, location.city].filter(Boolean).join(', ')}.`
                : `Получать в MAX уведомления о новых просьбах в ${[location.district, location.city].filter(Boolean).join(', ')}?`}
            </p>
            {error && <span className="location-editor__error" role="alert">{error}</span>}
            <button type="button" className="notification-dialog__primary" disabled={busy} onClick={toggleNotifications}>
              {busy ? 'Сохраняем…' : notificationsEnabled ? 'Отключить уведомления' : 'Включить в MAX'}
            </button>
            <button type="button" className="notification-dialog__secondary" disabled={busy} onClick={() => setPromptOpen(false)}>
              {notificationsEnabled ? 'Закрыть' : 'Пока нет'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
