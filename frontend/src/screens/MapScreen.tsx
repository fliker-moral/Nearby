import { forwardRef } from 'react';
import MapView, { type MapViewHandle } from '../map/MapView';
import SearchBar from '../components/SearchBar';
import CategoryFilter, { type CategoryValue } from '../components/CategoryFilter';
import MapControls from '../components/MapControls';
import type { LngLat, Task } from '../types';

interface MapScreenProps {
  tasks: Task[];
  allTasks: Task[];
  selectedId: string | null;
  userLocation: LngLat | null;
  search: string;
  category: CategoryValue;
  source: 'api' | 'mock' | 'loading';
  onSearch: (v: string) => void;
  onCategory: (v: CategoryValue) => void;
  onSelectTask: (task: Task) => void;
  onUserLocation: (p: LngLat) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

const MapScreen = forwardRef<MapViewHandle, MapScreenProps>(function MapScreen(
  props,
  ref,
) {
  const counts: Record<CategoryValue, number> = {
    ALL: props.allTasks.length,
    PERSONAL_HELP: props.allTasks.filter((t) => t.category === 'PERSONAL_HELP').length,
    EVENT_ORGANIZATION: props.allTasks.filter((t) => t.category === 'EVENT_ORGANIZATION')
      .length,
    OTHER: props.allTasks.filter((t) => t.category === 'OTHER').length,
  };

  const available = props.tasks.filter((t) => t.status === 'PUBLISHED').length;

  return (
    <div className="screen screen--map">
      <MapView
        ref={ref}
        tasks={props.tasks}
        selectedId={props.selectedId}
        userLocation={props.userLocation}
        onSelectTask={props.onSelectTask}
        onUserLocation={props.onUserLocation}
      />

      <div className="map-top">
        <SearchBar value={props.search} onChange={props.onSearch} />
        <CategoryFilter
          value={props.category}
          counts={counts}
          onChange={props.onCategory}
        />
      </div>

      <div className="map-hint">
        {props.source === 'mock' && (
          <span className="badge badge--demo">demo-данные</span>
        )}
        <span className="badge">
          🟢 {available} свободных рядом
        </span>
      </div>

      <MapControls
        onZoomIn={props.onZoomIn}
        onZoomOut={props.onZoomOut}
        onLocate={props.onLocate}
      />
    </div>
  );
});

export default MapScreen;
