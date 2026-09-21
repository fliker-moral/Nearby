import { forwardRef } from 'react';
import MapView, { type MapViewHandle } from '../map/MapView';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ModeToggle from '../components/ModeToggle';
import KindChips from '../components/KindChips';
import MapControls from '../components/MapControls';
import RequestSheet from '../components/RequestSheet';
import EventCard from '../components/EventCard';
import { BRAND, type Mode } from '../config';
import type { LngLat, Task } from '../types';

interface MapScreenProps {
  mode: Mode;
  visibleTasks: Task[];
  selected: Task | null;
  sheetExpanded: boolean;
  userLocation: LngLat | null;
  search: string;
  kind: string | 'ALL';
  source: 'api' | 'mock' | 'loading';
  assigning: boolean;
  onMode: (m: Mode) => void;
  onSearch: (v: string) => void;
  onKind: (v: string | 'ALL') => void;
  onSelectTask: (t: Task) => void;
  onUserLocation: (p: LngLat) => void;
  onToggleExpand: () => void;
  onCloseSheet: () => void;
  onAssign: (t: Task) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

const MapScreen = forwardRef<MapViewHandle, MapScreenProps>(function MapScreen(props, ref) {
  const available = props.visibleTasks.filter((t) => t.status === 'PUBLISHED').length;

  return (
    <div className="screen screen--map">
      <MapView
        ref={ref}
        tasks={props.visibleTasks}
        selectedId={props.selected?.id ?? null}
        userLocation={props.userLocation}
        onSelectTask={props.onSelectTask}
        onUserLocation={props.onUserLocation}
      />

      <div className="map-top">
        <Header title={BRAND.name} subtitle={BRAND.tagline} city={BRAND.city} />
        <SearchBar
          value={props.search}
          placeholder={props.mode === 'help' ? 'Поиск по адресам и просьбам' : 'Поиск событий'}
          onChange={props.onSearch}
        />
        <ModeToggle mode={props.mode} onChange={props.onMode} />
        <KindChips mode={props.mode} value={props.kind} onChange={props.onKind} />
      </div>

      <MapControls
        onZoomIn={props.onZoomIn}
        onZoomOut={props.onZoomOut}
        onLocate={props.onLocate}
      />

      {props.mode === 'help' && props.source === 'mock' && (
        <div className="map-hint">
          <span className="badge badge--demo">demo</span>
          <span className="badge">🟢 {available} свободных рядом</span>
        </div>
      )}

      {props.mode === 'help' && props.selected && (
        <RequestSheet
          task={props.selected}
          userLocation={props.userLocation}
          expanded={props.sheetExpanded}
          assigning={props.assigning}
          onToggleExpand={props.onToggleExpand}
          onClose={props.onCloseSheet}
          onAssign={props.onAssign}
        />
      )}

      {props.mode === 'events' && (
        <div className="events-panel">
          <div className="events-panel__head">
            <b>Ближайшие события</b>
            <span className="muted">{props.visibleTasks.length}</span>
          </div>
          <div className="events-list">
            {props.visibleTasks.map((e) => (
              <EventCard key={e.id} event={e} onOpen={props.onSelectTask} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default MapScreen;
