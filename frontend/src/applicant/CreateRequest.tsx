import { useEffect, useState } from 'react';
import { HELP_CHIPS, KIND_META } from '../config';
import type { MyRequest } from './types';
import { CloseIcon, CheckIcon } from '../components/icons';
import { listAuthoredTasks, suggestAddresses, type AddressSuggestion } from '../api/client';
import { getCurrentUser } from '../lib/maxBridge';
import AddressMapPicker from './AddressMapPicker';

interface CreateRequestProps {
  onClose: () => void;
  onCreate: (data: Pick<MyRequest, 'kind' | 'title' | 'description' | 'address' | 'when' | 'lat' | 'lon'>) => Promise<void>;
}

function shortDate(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
}

const DATE_OPTIONS = [
  { key: 'today', label: 'Сегодня', date: shortDate(0) },
  { key: 'tomorrow', label: 'Завтра', date: shortDate(1) },
  { key: 'day2', label: 'Через 2 дня', date: shortDate(2) },
  { key: 'day3', label: 'Через 3 дня', date: shortDate(3) },
] as const;
const TIME_PRESETS = [
  { label: 'Утром', detail: '08:00–12:00', value: '08:00–12:00' },
  { label: 'Днём', detail: '12:00–18:00', value: '12:00–18:00' },
  { label: 'Вечером', detail: '18:00–21:00', value: '18:00–21:00' },
  { label: 'В любое время', detail: 'Без ограничений', value: 'В любое время' },
];

interface PreferredAddress extends AddressSuggestion {
  lat: number;
  lon: number;
  count: number;
}

function preferredAddressStorageKey(): string {
  const maxId = typeof localStorage === 'undefined' ? null : localStorage.getItem('nearby.maxId');
  const userId = getCurrentUser().id;
  return `nearby.preferred-addresses.${userId || maxId || 'local'}`;
}

function readPreferredAddresses(): PreferredAddress[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(preferredAddressStorageKey()) ?? '[]');
    return Array.isArray(parsed) ? parsed as PreferredAddress[] : [];
  } catch {
    return [];
  }
}

function rememberAddress(address: PreferredAddress): void {
  const current = readPreferredAddresses();
  const existing = current.find((item) => item.value.toLowerCase() === address.value.toLowerCase());
  const next = existing
    ? current.map((item) => item.value.toLowerCase() === address.value.toLowerCase() ? { ...address, count: existing.count + 1 } : item)
    : [...current, { ...address, count: 1 }];
  try {
    localStorage.setItem(preferredAddressStorageKey(), JSON.stringify(next.sort((a, b) => b.count - a.count).slice(0, 6)));
  } catch {
    // Local preferences are optional; the request itself can still be submitted.
  }
}

export default function CreateRequest({ onClose, onCreate }: CreateRequestProps) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateKey, setDateKey] = useState<(typeof DATE_OPTIONS)[number]['key']>('today');
  const [timeMode, setTimeMode] = useState<'exact' | 'range'>('exact');
  const [exactTime, setExactTime] = useState('10:15');
  const [timeStart, setTimeStart] = useState('08:00');
  const [timeEnd, setTimeEnd] = useState('12:00');
  const [timePreset, setTimePreset] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [preferredAddresses, setPreferredAddresses] = useState<PreferredAddress[]>(readPreferredAddresses);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    listAuthoredTasks().then((tasks) => {
      const counts = new Map<string, PreferredAddress>();
      for (const task of tasks) {
        const value = (task.address_text ?? task.address_hint).trim();
        if (!value || !Number.isFinite(task.lat) || !Number.isFinite(task.lon)) continue;
        const key = value.toLowerCase();
        const current = counts.get(key);
        counts.set(key, {
          value,
          city: null,
          region: null,
          street: null,
          house: null,
          lat: task.lat,
          lon: task.lon,
          count: (current?.count ?? 0) + 1,
        });
      }
      if (counts.size) {
        const fromRequests = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 6);
        setPreferredAddresses(fromRequests);
        try {
          localStorage.setItem(preferredAddressStorageKey(), JSON.stringify(fromRequests));
        } catch {
          // Favorites can still be used for this session.
        }
      }
    }).catch(() => undefined);
  }, []);

  const pickKind = (k: string) => {
    setKind(k);
    setTitle(KIND_META[k].label);
    setStep(1);
  };

  const submit = async () => {
    if (!kind || !address.trim() || isSubmitting) return;
    const place = selectedAddress;
    if (place?.lat == null || place.lon == null) return;
    rememberAddress({ ...place, lat: place.lat, lon: place.lon, count: 0 });
    setPreferredAddresses(readPreferredAddresses());
    const selectedTime = timePreset ?? (timeMode === 'exact' ? exactTime : `${timeStart}–${timeEnd}`);
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onCreate({
        kind,
        title: title.trim() || KIND_META[kind].label,
        description,
        address,
        when: `${DATE_OPTIONS.find((option) => option.key === dateKey)?.label} · ${selectedTime}`,
        lat: place.lat,
        lon: place.lon,
      });
    } catch {
      setSubmitError('Не удалось отправить просьбу. Проверьте соединение и попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTime = timePreset ?? (timeMode === 'exact' ? exactTime : `${timeStart}–${timeEnd}`);

  const onAddressChange = (value: string) => {
    setAddress(value);
    setSelectedAddress(null);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    suggestAddresses(value).then(setSuggestions).catch(() => setSuggestions([]));
  };

  const chooseAddress = (place: AddressSuggestion) => {
    setAddress(place.value);
    setSelectedAddress(place);
    setSuggestions([]);
  };

  return (
    <div className="a-modal">
      <header className="a-modal__head">
        <button className="a-icon-btn" disabled={isSubmitting} onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>
          {step === 0 ? <CloseIcon width={24} height={24} /> : '‹ Назад'}
        </button>
        <span className="a-modal__title">Новая просьба</span>
        <span className="a-step">{step + 1} из 3</span>
      </header>

      <div className="a-modal__body">
        {step === 0 && (
          <>
            <h2 className="a-q">С чем нужна помощь?</h2>
            <div className="a-kinds">
              {HELP_CHIPS.map((k) => (
                <button key={k} className="a-kind" onClick={() => pickKind(k)}>
                  <span className="a-kind__emoji">{KIND_META[k].emoji}</span>
                  <span className="a-kind__label">{KIND_META[k].label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="a-q">Расскажите подробнее</h2>
            <label className="a-label">Коротко о просьбе</label>
            <input
              className="a-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: купить лекарства"
            />
            <label className="a-label">Что нужно сделать?</label>
            <textarea
              className="a-input a-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите, что нужно. Волонтёр это увидит."
              rows={4}
            />
            <label className="a-label">Когда нужно?</label>
            <div className="a-date-grid">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`a-date-card${dateKey === option.key ? ' a-date-card--on' : ''}`}
                  onClick={() => setDateKey(option.key)}
                >
                  <b>{option.label}</b>
                  <span>{option.date}</span>
                </button>
              ))}
            </div>
            <label className="a-label">Выберите время</label>
            <div className="a-time-modes" role="group" aria-label="Способ выбора времени">
              <button type="button" className={`a-time-mode${timeMode === 'exact' ? ' a-time-mode--on' : ''}`} onClick={() => { setTimeMode('exact'); setTimePreset(null); }}>Точное время</button>
              <button type="button" className={`a-time-mode${timeMode === 'range' ? ' a-time-mode--on' : ''}`} onClick={() => { setTimeMode('range'); setTimePreset(null); }}>Промежуток</button>
            </div>
            <div className="a-time-panel">
              <span className="a-time-panel__label">{timeMode === 'exact' ? 'Точное время' : 'Укажите промежуток'}</span>
              {timeMode === 'exact' ? (
                <input className="a-input a-time-input" type="time" value={exactTime} onChange={(event) => { setExactTime(event.target.value); setTimePreset(null); }} />
              ) : (
                <div className="a-time-range">
                  <input className="a-input a-time-input" aria-label="Начало промежутка" type="time" value={timeStart} onChange={(event) => { setTimeStart(event.target.value); setTimePreset(null); }} />
                  <span>—</span>
                  <input className="a-input a-time-input" aria-label="Конец промежутка" type="time" value={timeEnd} onChange={(event) => { setTimeEnd(event.target.value); setTimePreset(null); }} />
                </div>
              )}
            </div>
            <div className="a-time-presets" aria-label="Готовое время">
              {TIME_PRESETS.map((preset) => (
                <button key={preset.label} type="button" className={`a-time-preset${timePreset === preset.value ? ' a-time-preset--on' : ''}`} onClick={() => setTimePreset(preset.value)}>
                  <b>{preset.label}</b><span>{preset.detail}</span>
                </button>
              ))}
            </div>
            <button className="a-btn a-btn--primary" onClick={() => setStep(2)}>
              Дальше
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="a-q">Куда прийти?</h2>
            <label className="a-label">Ваш адрес</label>
            <input
              className="a-input"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="Введите адрес или выберите место на карте"
            />
            <button type="button" className="a-map-pick" onClick={() => setMapPickerOpen(true)}>
              <span aria-hidden="true">⌖</span> Выбрать на карте
            </button>
            {suggestions.length > 0 && (
              <div className="a-address-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={`${suggestion.value}-${suggestion.lat}-${suggestion.lon}`}
                    onClick={() => chooseAddress(suggestion)}
                  >
                    <b>{suggestion.value}</b>
                    <span>{[suggestion.city, suggestion.region].filter(Boolean).join(', ')}</span>
                  </button>
                ))}
              </div>
            )}
            {suggestions.length === 0 && address.length === 0 && preferredAddresses.length > 0 && (
              <div className="a-address-favorites">
                <span className="a-address-favorites__title">Часто выбираемые места</span>
                {preferredAddresses.map((place) => (
                  <button type="button" key={`${place.value}-${place.lat}-${place.lon}`} onClick={() => chooseAddress(place)}>
                    <span aria-hidden="true">◷</span><b>{place.value}</b>
                  </button>
                ))}
              </div>
            )}
            <div className="a-note">
              🔒 Точный адрес и телефон увидит только волонтёр, которого вы выберете.
            </div>

            <div className="a-summary">
              <div className="a-summary__row">
                <span className="a-summary__k">{kind && KIND_META[kind].emoji} Просьба</span>
                <b>{title}</b>
              </div>
              <div className="a-summary__row">
                <span className="a-summary__k">🕐 Когда</span>
                <b>{DATE_OPTIONS.find((option) => option.key === dateKey)?.label} · {selectedTime}</b>
              </div>
            </div>

            {submitError && <div className="a-submit-error" role="alert">{submitError}</div>}
            <button className="a-btn a-btn--primary" onClick={submit} disabled={isSubmitting || !address.trim() || !(selectedAddress?.lat != null && selectedAddress.lon != null)}>
              {isSubmitting ? 'Отправляем…' : <><CheckIcon width={22} height={22} /> Опубликовать просьбу</>}
            </button>
          </>
        )}
      </div>
      {mapPickerOpen && (
        <AddressMapPicker
          initialPoint={selectedAddress?.lat != null && selectedAddress.lon != null ? { lat: selectedAddress.lat, lon: selectedAddress.lon } : undefined}
          onCancel={() => setMapPickerOpen(false)}
          onChoose={(point) => {
            const place: AddressSuggestion = {
              value: `Точка на карте (${point.lat.toFixed(5)}, ${point.lon.toFixed(5)})`,
              city: null, region: null, street: null, house: null, lat: point.lat, lon: point.lon,
            };
            setAddress(place.value);
            setSelectedAddress(place);
            setSuggestions([]);
            setMapPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
