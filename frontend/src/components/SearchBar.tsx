import { SearchIcon, SlidersIcon, CloseIcon } from './icons';

interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, placeholder, onChange }: SearchBarProps) {
  return (
    <div className="search-row">
      <div className="search-bar">
        <SearchIcon className="search-bar__icon" width={20} height={20} />
        <input
          className="search-bar__input"
          type="text"
          inputMode="search"
          placeholder={placeholder ?? 'Поиск по адресам и просьбам'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Поиск"
        />
        {value && (
          <button className="search-bar__btn" onClick={() => onChange('')} aria-label="Очистить">
            <CloseIcon width={18} height={18} />
          </button>
        )}
      </div>
      <button className="icon-round icon-round--filter" aria-label="Фильтры">
        <SlidersIcon width={20} height={20} />
      </button>
    </div>
  );
}
