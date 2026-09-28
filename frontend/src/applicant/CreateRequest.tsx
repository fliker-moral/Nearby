import { useState } from 'react';
import { HELP_CHIPS, KIND_META } from '../config';
import type { MyRequest } from './types';
import { CloseIcon, CheckIcon } from '../components/icons';

interface CreateRequestProps {
  defaultAddress: string;
  onClose: () => void;
  onCreate: (data: Pick<MyRequest, 'kind' | 'title' | 'description' | 'address' | 'when'>) => void;
}

const WHEN_OPTIONS = ['Сегодня, до 18:00', 'Сегодня, вечером', 'Завтра, утром', 'В ближайшие дни'];

export default function CreateRequest({ defaultAddress, onClose, onCreate }: CreateRequestProps) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState(WHEN_OPTIONS[0]);
  const [address, setAddress] = useState(defaultAddress);

  const pickKind = (k: string) => {
    setKind(k);
    setTitle(KIND_META[k].label);
    setStep(1);
  };

  const submit = () => {
    if (!kind) return;
    onCreate({ kind, title: title.trim() || KIND_META[kind].label, description, address, when });
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
            <div className="a-chips">
              {WHEN_OPTIONS.map((w) => (
                <button
                  key={w}
                  className={`a-when${when === w ? ' a-when--on' : ''}`}
                  onClick={() => setWhen(w)}
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
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Улица, дом, квартира"
            />
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
                <b>{when}</b>
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
