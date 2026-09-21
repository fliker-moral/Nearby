import { BellIcon, ChevronRightIcon } from './icons';

interface HeaderProps {
  title: string;
  subtitle: string;
  city: string;
}

export default function Header({ title, subtitle, city }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__text">
        <h1 className="app-header__title">{title}</h1>
        <p className="app-header__subtitle">{subtitle}</p>
      </div>
      <div className="app-header__actions">
        <button className="city-pill">
          {city}
          <ChevronRightIcon width={14} height={14} className="city-pill__chev" />
        </button>
        <button className="icon-round" aria-label="Уведомления">
          <BellIcon width={20} height={20} />
          <span className="icon-round__dot" />
        </button>
      </div>
    </header>
  );
}
