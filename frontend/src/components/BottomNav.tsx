import type { ComponentType, SVGProps } from 'react';
import { MapIcon, ListIcon, ProfileIcon } from './icons';

export type Tab = 'map' | 'myhelp' | 'profile';

const TABS: { key: Tab; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: 'map', label: 'Карта', icon: MapIcon },
  { key: 'myhelp', label: 'Моя помощь', icon: ListIcon },
  { key: 'profile', label: 'Профиль', icon: ProfileIcon },
];

interface BottomNavProps {
  active: Tab;
  badges?: Partial<Record<Tab, number>>;
  onChange: (t: Tab) => void;
}

export default function BottomNav({ active, badges, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        const badge = badges?.[key];
        return (
          <button
            key={key}
            className={`nav-item${isActive ? ' nav-item--active' : ''}`}
            onClick={() => onChange(key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="nav-item__icon">
              <Icon width={24} height={24} />
              {badge ? <span className="nav-item__badge">{badge}</span> : null}
            </span>
            <span className="nav-item__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
