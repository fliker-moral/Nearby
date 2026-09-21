import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE_URL } from '../config';
import type { LngLat, Task } from '../types';
import { addTaskLayers, registerPinImages, updateTaskData } from './taskLayer';

export interface MapViewHandle {
  flyTo: (p: LngLat, zoom?: number) => void;
  locate: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resize: () => void;
}

interface MapViewProps {
  tasks: Task[];
  selectedId: string | null;
  userLocation: LngLat | null;
  onSelectTask: (task: Task) => void;
  onUserLocation: (p: LngLat) => void;
  onReady?: () => void;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { tasks, selectedId, userLocation, onSelectTask, onUserLocation, onReady },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const readyRef = useRef(false);
  const [loading, setLoading] = useState(true);

  // Свежие данные/колбэки в ref, чтобы init-эффект оставался одноразовым.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const onSelectRef = useRef(onSelectTask);
  onSelectRef.current = onSelectTask;

  // ── Инициализация карты (один раз) ─────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
      // Плоская карта как в Яндекс Go: без наклона и вращения — быстро и удобно.
      pitch: 0,
      bearing: 0,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      fadeDuration: 100,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();

    map.on('load', async () => {
      // Иконки должны быть готовы ДО создания слоя с пинами.
      await registerPinImages(map);
      const selectFromMap = (id: string) => {
        const task = tasksRef.current.find((t) => t.id === id);
        if (task) onSelectRef.current(task);
      };
      addTaskLayers(map, tasksRef.current, selectFromMap);
      readyRef.current = true;
      setLoading(false);
      onReady?.();
    });

    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Обновление данных задач + подсветки выбора ─────────────────────────
  useEffect(() => {
    if (readyRef.current && mapRef.current) {
      updateTaskData(mapRef.current, tasks, selectedId);
    }
  }, [tasks, selectedId]);

  // ── Маркер местоположения пользователя ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = '<span class="user-marker__dot"></span>';
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lon, userLocation.lat]);
    }
  }, [userLocation]);

  // ── Императивный API для родителя ──────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => {
      mapRef.current?.flyTo({
        center: [p.lon, p.lat],
        zoom: zoom ?? Math.max(mapRef.current.getZoom(), 16),
        duration: 900,
        essential: true,
      });
    },
    locate: () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p: LngLat = { lon: pos.coords.longitude, lat: pos.coords.latitude };
          onUserLocation(p);
          mapRef.current?.flyTo({ center: [p.lon, p.lat], zoom: 16, duration: 900 });
        },
        () => {
          /* отказ в геолокации — остаёмся на дефолтном центре */
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    },
    zoomIn: () => mapRef.current?.zoomIn({ duration: 300 }),
    zoomOut: () => mapRef.current?.zoomOut({ duration: 300 }),
    resize: () => mapRef.current?.resize(),
  }));

  return (
    <div className="map-view">
      <div className="map-canvas" ref={containerRef} />
      {loading && (
        <div className="map-loading" aria-hidden>
          <span className="map-loading__spinner" />
          <span className="map-loading__text">Загружаем карту…</span>
        </div>
      )}
    </div>
  );
});

export default MapView;
