import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { DEFAULT_CENTER, DEFAULT_ZOOM, KIND_META, MODE_COLOR, YANDEX_API_KEY } from '../config';
import type { LngLat, Task } from '../types';
import type { MapViewHandle, MapViewProps } from './mapTypes';

/* eslint-disable @typescript-eslint/no-explicit-any */
// ymaps3 подгружается как глобальный объект, поэтому типизируем свободно.
type Ymaps3 = any;
declare global {
  interface Window {
    ymaps3?: Ymaps3;
  }
}

let loader: Promise<Ymaps3> | null = null;

/** Однократно грузит ymaps3 и дожидается готовности API. */
function loadYmaps(apikey: string): Promise<Ymaps3> {
  if (window.ymaps3) return window.ymaps3.ready.then(() => window.ymaps3);
  if (loader) return loader;
  loader = new Promise<Ymaps3>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apikey)}&lang=ru_RU`;
    s.async = true;
    s.onload = () => window.ymaps3!.ready.then(() => resolve(window.ymaps3));
    s.onerror = () => reject(new Error('Не удалось загрузить Yandex Maps API'));
    document.head.appendChild(s);
  });
  return loader;
}

function isAvailable(t: Task): boolean {
  return t.status === 'PUBLISHED';
}

/** DOM-пин «каплей» с иконкой подкатегории (Яндекс позиционирует его сам). */
function createPinEl(task: Task): HTMLElement {
  const meta = KIND_META[task.kind];
  const color = MODE_COLOR[meta ? meta.mode : 'help'];
  const emoji = meta?.emoji ?? '📍';
  const muted = !isAvailable(task) && task.status !== 'IN_PROGRESS';
  const fill = muted ? '#aab3c2' : color;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'ya-pin';
  el.setAttribute('aria-label', task.title);
  el.innerHTML =
    `<span class="ya-pin__inner">` +
    `<svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M20 2C11 2 4 9 4 18c0 12 16 32 16 32s16-20 16-32C36 9 29 2 20 2Z" ` +
    `fill="${fill}" stroke="#ffffff" stroke-width="3"/>` +
    `<circle cx="20" cy="18" r="9.5" fill="#ffffff"/></svg>` +
    `<span class="ya-pin__glyph">${emoji}</span>` +
    `</span>`;
  return el;
}

interface Entry {
  marker: any;
  el: HTMLElement;
  status: Task['status'];
}

interface YandexProps extends MapViewProps {
  /** Вызывается, если ymaps3 не загрузился — родитель откатывается на MapLibre. */
  onFallback?: () => void;
}

const MapViewYandex = forwardRef<MapViewHandle, YandexProps>(function MapViewYandex(
  { tasks, selectedId, userLocation, onSelectTask, onUserLocation, onReady, onFallback },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const ymRef = useRef<Ymaps3>(null);
  const markersRef = useRef<Map<string, Entry>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const cameraRef = useRef<{ center: [number, number]; zoom: number }>({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  });
  const readyRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const onSelectRef = useRef(onSelectTask);
  onSelectRef.current = onSelectTask;

  // ── Инициализация ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    loadYmaps(YANDEX_API_KEY)
      .then((ymaps3) => {
        if (cancelled || !containerRef.current) return;
        ymRef.current = ymaps3;
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapListener } =
          ymaps3;

        const map = new YMap(containerRef.current, {
          location: { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM },
          mode: 'vector',
        });
        map.addChild(new YMapDefaultSchemeLayer());
        map.addChild(new YMapDefaultFeaturesLayer());
        map.addChild(
          new YMapListener({
            onUpdate: (o: any) => {
              if (o?.location) {
                cameraRef.current = {
                  center: o.location.center,
                  zoom: o.location.zoom,
                };
              }
            },
          }),
        );
        mapRef.current = map;
        readyRef.current = true;
        syncMarkers(tasksRef.current);
        setLoading(false);
        onReady?.();
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
          // Ключ ещё не активен / API недоступен — просим родителя откатиться на MapLibre.
          onFallback?.();
        }
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((e) => mapRef.current?.removeChild(e.marker));
      markersRef.current.clear();
      if (userMarkerRef.current) mapRef.current?.removeChild(userMarkerRef.current);
      userMarkerRef.current = null;
      mapRef.current?.destroy?.();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Синхронизация меток ────────────────────────────────────────────────
  function syncMarkers(list: Task[]) {
    const map = mapRef.current;
    const ymaps3 = ymRef.current;
    if (!map || !ymaps3 || !readyRef.current) return;
    const store = markersRef.current;
    const seen = new Set<string>();

    for (const task of list) {
      seen.add(task.id);
      const existing = store.get(task.id);
      if (existing) {
        existing.marker.update({ coordinates: [task.lon, task.lat] });
        if (existing.status !== task.status) {
          const fresh = createPinEl(task);
          fresh.classList.toggle('ya-pin--selected', task.id === selectedId);
          bindClick(fresh, task);
          existing.el.replaceWith(fresh);
          existing.el = fresh;
          existing.status = task.status;
        }
        continue;
      }
      const el = createPinEl(task);
      el.classList.toggle('ya-pin--selected', task.id === selectedId);
      bindClick(el, task);
      const marker = new ymaps3.YMapMarker({ coordinates: [task.lon, task.lat] }, el);
      map.addChild(marker);
      store.set(task.id, { marker, el, status: task.status });
    }

    for (const [id, entry] of store) {
      if (!seen.has(id)) {
        map.removeChild(entry.marker);
        store.delete(id);
      }
    }
  }

  function bindClick(el: HTMLElement, task: Task) {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onSelectRef.current(task);
    });
  }

  useEffect(() => {
    syncMarkers(tasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  // ── Подсветка выбранной метки ──────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach((entry, id) => {
      entry.el.classList.toggle('ya-pin--selected', id === selectedId);
    });
  }, [selectedId]);

  // ── Маркер пользователя ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymRef.current;
    if (!map || !ymaps3 || !userLocation) return;
    const coords: [number, number] = [userLocation.lon, userLocation.lat];
    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = '<span class="user-marker__dot"></span>';
      userMarkerRef.current = new ymaps3.YMapMarker({ coordinates: coords }, el);
      map.addChild(userMarkerRef.current);
    } else {
      userMarkerRef.current.update({ coordinates: coords });
    }
  }, [userLocation]);

  // ── Императивный API ───────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => {
      mapRef.current?.setLocation({
        center: [p.lon, p.lat],
        zoom: zoom ?? Math.max(cameraRef.current.zoom, 16),
        duration: 700,
        easing: 'ease-in-out',
      });
    },
    locate: () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p: LngLat = { lon: pos.coords.longitude, lat: pos.coords.latitude };
          onUserLocation(p);
          mapRef.current?.setLocation({
            center: [p.lon, p.lat],
            zoom: 16,
            duration: 700,
          });
        },
        () => {
          /* отказ в геолокации */
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    },
    zoomIn: () =>
      mapRef.current?.setLocation({
        center: cameraRef.current.center,
        zoom: cameraRef.current.zoom + 1,
        duration: 200,
      }),
    zoomOut: () =>
      mapRef.current?.setLocation({
        center: cameraRef.current.center,
        zoom: cameraRef.current.zoom - 1,
        duration: 200,
      }),
    resize: () => {
      /* ymaps3 сам отслеживает размер контейнера */
    },
  }));

  return (
    <div className="map-view">
      <div className="map-canvas" ref={containerRef} />
      {loading && !error && (
        <div className="map-loading" aria-hidden>
          <span className="map-loading__spinner" />
          <span className="map-loading__text">Загружаем карту…</span>
        </div>
      )}
      {error && (
        <div className="map-loading">
          <span className="map-loading__text">
            Карта Яндекса не загрузилась.
            <br />
            Проверьте ключ VITE_YANDEX_API_KEY и HTTP-referer.
            <br />
            Новый ключ может активироваться до 15+ минут.
          </span>
        </div>
      )}
    </div>
  );
});

export default MapViewYandex;
