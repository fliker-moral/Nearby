import { EVENT_CHIPS, HELP_CHIPS, KIND_META, type Mode } from '../config';

interface KindChipsProps {
  mode: Mode;
  value: string | 'ALL';
  onChange: (v: string | 'ALL') => void;
}

export default function KindChips({ mode, value, onChange }: KindChipsProps) {
  const kinds = mode === 'help' ? HELP_CHIPS : EVENT_CHIPS;
  return (
    <div className="chips" role="tablist" aria-label="Категории">
      <button
        role="tab"
        aria-selected={value === 'ALL'}
        className={`chip chip--all${value === 'ALL' ? ' chip--all-active' : ''}`}
        onClick={() => onChange('ALL')}
      >
        Все
      </button>
      {kinds.map((k) => {
        const meta = KIND_META[k];
        const active = value === k;
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            className={`chip${active ? ' chip--active' : ''}`}
            onClick={() => onChange(k)}
          >
            <span className="chip__emoji">{meta.emoji}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
