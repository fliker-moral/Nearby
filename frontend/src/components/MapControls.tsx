import { LayersIcon, PlusIcon, MinusIcon, LocateIcon } from './icons';

interface MapControlsProps {
  is3D: boolean;
  onToggle3D: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

export default function MapControls({
  is3D,
  onToggle3D,
  onZoomIn,
  onZoomOut,
  onLocate,
}: MapControlsProps) {
  return (
    <div className="map-controls">
      <button
        className={`ctl ctl--mode${is3D ? ' ctl--on' : ''}`}
        onClick={onToggle3D}
        aria-pressed={is3D}
        title={is3D ? 'Плоская карта (2D)' : 'Объёмная карта (3D)'}
      >
        <LayersIcon width={22} height={22} />
        <span className="ctl__badge">{is3D ? '3D' : '2D'}</span>
      </button>

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
