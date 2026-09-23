import type { Mode } from '../config';
import { HeartIcon } from './icons';

interface ModeToggleProps {
  mode: Mode;
  onChange: (m: Mode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-toggle__btn mode-toggle__btn--help${
          mode === 'help' ? ' is-active' : ''
        }`}
        onClick={() => onChange('help')}
      >
        <HeartIcon width={18} height={18} />
        Нужна помощь
      </button>
      <button
        className={`mode-toggle__btn mode-toggle__btn--events${
          mode === 'events' ? ' is-active' : ''
        }`}
        onClick={() => onChange('events')}
      >
        <span className="mode-toggle__emoji">🎉</span>
        События
      </button>
    </div>
  );
}
