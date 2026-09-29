import { useState } from 'react';
import { HELP_CHIPS, KIND_META } from '../config';
import type { MyRequest } from './types';
import { CloseIcon, CheckIcon } from '../components/icons';
import { suggestAddresses, type AddressSuggestion } from '../api/client';

interface CreateRequestProps {
  defaultAddress: string;
  onClose: () => void;
  onCreate: (data: Pick<MyRequest, 'kind' | 'title' | 'description' | 'address' | 'when' | 'lat' | 'lon'>) => void;
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
const TIME_OPTIONS = ['До 18:00', '18:00–21:00', 'В любое время'];

export default function CreateRequest({ defaultAddress, onClose, onCreate }: CreateRequestProps) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateKey, setDateKey] = useState<(typeof DATE_OPTIONS)[number]['key']>('today');
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [address, setAddress] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  const pickKind = (k: string) => {
    setKind(k);
    setTitle(KIND_META[k].label);
    setStep(1);
  };

  const submit = () => {
    if (!kind) return;
    onCreate({
      kind,
      title: title.trim() || KIND_META[kind].label,
      description,
      address,
      when: `${DATE_OPTIONS.find((option) => option.key === dateKey)?.label} · ${time}`,
      lat: selectedAddress?.lat ?? 55.7512,
      lon: selectedAddress?.lon ?? 37.6183,
    });
  };

  const onAddressChange = (value: string) => {
    setAddress(value);
    setSelectedAddress(null);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    suggestAddresses(value).then(setSuggestions).catch(() => setSuggestions([]));
  };

  return (
    <div className="a-modal">
      <header className="a-modal__head">
        <button className="a-icon-btn" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>
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
            <div className="a-chips">
              {TIME_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`a-when${time === w ? ' a-when--on' : ''}`}
                  onClick={() => setTime(w)}
                >
                  {w}
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
              placeholder="Москва, улица, дом"
            />
            {suggestions.length > 0 && (
              <div className="a-address-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={`${suggestion.value}-${suggestion.lat}-${suggestion.lon}`}
                    onClick={() => {
                      setAddress(suggestion.value);
                      setSelectedAddress(suggestion);
                      setSuggestions([]);
                    }}
                  >
                    <b>{suggestion.value}</b>
                    <span>{[suggestion.city, suggestion.region].filter(Boolean).join(', ')}</span>
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
                <b>{DATE_OPTIONS.find((option) => option.key === dateKey)?.label} · {time}</b>
              </div>
            </div>

            <button className="a-btn a-btn--primary" onClick={submit}>
              <CheckIcon width={22} height={22} /> Опубликовать просьбу
            </button>
          </>
        )}
      </div>
    </div>
  );
}
