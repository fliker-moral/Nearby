import { SearchIcon, MicIcon, CloseIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
}

export default function SearchBar({ value, onChange, onFocus }: SearchBarProps) {
  return (
    <div className="search-bar">
      <SearchIcon className="search-bar__icon" width={20} height={20} />
      <input
        className="search-bar__input"
        type="text"
        inputMode="search"
        placeholder="Поиск заявок и адресов"
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Поиск"
      />
      {value ? (
        <button
          className="search-bar__btn"
          onClick={() => onChange('')}
          aria-label="Очистить"
        >
          <CloseIcon width={18} height={18} />
        </button>
      ) : (
        <button className="search-bar__btn" aria-label="Голосовой поиск" disabled>
          <MicIcon width={20} height={20} />
        </button>
      )}
    </div>
  );
}
