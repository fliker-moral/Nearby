import { PlusIcon, MinusIcon, LocateIcon } from './icons';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onLocate }: MapControlsProps) {
  return (
    <div className="map-controls">
      <div className="ctl-group">
        <button className="ctl" onClick={onZoomIn} aria-label="Приблизить">
          <PlusIcon width={22} height={22} />
        </button>
        <span className="ctl-group__sep" />
        <button className="ctl" onClick={onZoomOut} aria-label="Отдалить">
          <MinusIcon width={22} height={22} />
        </button>
      </div>

      <button className="ctl" onClick={onLocate} aria-label="Моё местоположение">
        <LocateIcon width={22} height={22} />
      </button>
    </div>
  );
}
