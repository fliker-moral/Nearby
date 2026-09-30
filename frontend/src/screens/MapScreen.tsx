import { forwardRef } from 'react';
import MapView, { type MapViewHandle } from '../map/MapView';
import Header from '../components/Header';
import LocationFilter, { type UserLocationFilter } from '../components/LocationFilter';
import KindChips from '../components/KindChips';
import MapControls from '../components/MapControls';
import RequestSheet from '../components/RequestSheet';
import { BRAND, type Mode } from '../config';
import type { LngLat, Task } from '../types';
import type { RouteResult } from '../lib/routing';
import { formatDuration } from '../lib/routing';
import { formatDistance } from '../lib/geo';
import { RouteIcon, CloseIcon } from '../components/icons';

interface MapScreenProps {
  mode: Mode;
  visibleTasks: Task[];
  selected: Task | null;
  sheetExpanded: boolean;
  userLocation: LngLat | null;
  location: UserLocationFilter;
  notificationsEnabled: boolean;
  kind: string | 'ALL';
  source: 'api' | 'loading' | 'error';
  assigning: boolean;
  withdrawing: boolean;
  completing: boolean;
  coverLetter: string;
  routing: boolean;
  routeInfo: RouteResult | null;
  onMode: (m: Mode) => void;
  onLocationChange: (location: UserLocationFilter) => Promise<void>;
  onToggleNotifications: (enabled: boolean) => Promise<void>;
  onKind: (v: string | 'ALL') => void;
  onSelectTask: (t: Task) => void;
  onUserLocation: (p: LngLat) => void;
  onToggleExpand: () => void;
  onCloseSheet: () => void;
  onDismissSheet: () => void;
  onCoverLetterChange: (value: string) => void;
  onAssign: (t: Task, coverLetter: string) => void;
  onWithdraw: (t: Task) => void;
  onComplete: (t: Task) => void;
  onRoute: (t: Task) => void;
  onClearRoute: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

const MapScreen = forwardRef<MapViewHandle, MapScreenProps>(function MapScreen(props, ref) {
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
        <Header title={BRAND.name} subtitle={BRAND.tagline} />
        <LocationFilter
          location={props.location}
          notificationsEnabled={props.notificationsEnabled}
          onLocationChange={props.onLocationChange}
          onToggleNotifications={props.onToggleNotifications}
        />
        <KindChips mode={props.mode} value={props.kind} onChange={props.onKind} />
      </div>

      <MapControls
        onZoomIn={props.onZoomIn}
        onZoomOut={props.onZoomOut}
        onLocate={props.onLocate}
      />

      {props.mode === 'help' && props.routeInfo && (
        <div className="route-banner">
          <span className="route-banner__ic">
            <RouteIcon width={20} height={20} />
          </span>
          <span className="route-banner__text">
            <b>
              🚶 {formatDuration(props.routeInfo.duration_s)} ·{' '}
              {formatDistance(props.routeInfo.distance_m)}
            </b>
            <span>
              {props.routeInfo.fallback ? 'примерно (прямая линия)' : 'пеший маршрут до просьбы'}
            </span>
          </span>
          <button className="route-banner__close" onClick={props.onClearRoute} aria-label="Убрать маршрут">
            <CloseIcon width={18} height={18} />
          </button>
        </div>
      )}

      {props.mode === 'help' && props.selected && !props.routeInfo && (
        <RequestSheet
          task={props.selected}
          userLocation={props.userLocation}
          expanded={props.sheetExpanded}
          assigning={props.assigning}
          withdrawing={props.withdrawing}
          completing={props.completing}
          coverLetter={props.coverLetter}
          onCoverLetterChange={props.onCoverLetterChange}
          routing={props.routing}
          onToggleExpand={props.onToggleExpand}
          onClose={props.onCloseSheet}
          onDismiss={props.onDismissSheet}
          onAssign={props.onAssign}
          onWithdraw={props.onWithdraw}
          onComplete={props.onComplete}
          onRoute={props.onRoute}
        />
      )}

    </div>
  );
});

export default MapScreen;
