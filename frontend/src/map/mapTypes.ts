import type { LngLat, Task } from '../types';

/** Императивный API карты — общий для реализаций (MapLibre / Yandex). */
export interface MapViewHandle {
  flyTo: (p: LngLat, zoom?: number) => void;
  locate: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resize: () => void;
}

export interface MapViewProps {
  tasks: Task[];
  selectedId: string | null;
  userLocation: LngLat | null;
  onSelectTask: (task: Task) => void;
  onUserLocation: (p: LngLat) => void;
  onReady?: () => void;
}
