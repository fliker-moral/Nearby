import { CATEGORY_META } from '../config';
import type { TaskCategory } from '../types';

export type CategoryValue = TaskCategory | 'ALL';

interface CategoryFilterProps {
  value: CategoryValue;
  counts: Record<CategoryValue, number>;
  onChange: (v: CategoryValue) => void;
}

const ORDER: CategoryValue[] = ['ALL', 'PERSONAL_HELP', 'EVENT_ORGANIZATION', 'OTHER'];

export default function CategoryFilter({ value, counts, onChange }: CategoryFilterProps) {
  return (
    <div className="chips" role="tablist" aria-label="Категории задач">
      {ORDER.map((key) => {
        const active = value === key;
        const meta = key === 'ALL' ? null : CATEGORY_META[key];
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            className={`chip${active ? ' chip--active' : ''}`}
            style={
              active && meta
                ? { background: meta.color, borderColor: meta.color }
                : undefined
            }
            onClick={() => onChange(key)}
          >
            {meta ? <span className="chip__emoji">{meta.emoji}</span> : '⭐'}
            <span>{key === 'ALL' ? 'Все' : meta!.short}</span>
            <span className="chip__count">{counts[key] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
