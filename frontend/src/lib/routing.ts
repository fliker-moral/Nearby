import type { LngLat } from '../types';
import { distanceMeters } from './geo';

export interface RouteResult {
  /** Геометрия маршрута [lon, lat][]. */
  coords: [number, number][];
  distance_m: number;
  duration_s: number;
  /** true, если не удалось построить маршрут и вернули прямую линию. */
  fallback: boolean;
}

/**
 * Пеший маршрут между двумя точками через открытый OSRM (OpenStreetMap),
 * профиль foot. Бесплатно, без API-ключа. При ошибке — прямая линия.
 */
export async function fetchWalkingRoute(from: LngLat, to: LngLat): Promise<RouteResult> {
  const coordsStr = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url =
    `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordsStr}` +
    `?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data?.routes?.[0];
    const line = route?.geometry?.coordinates as [number, number][] | undefined;
    if (!line || line.length < 2) throw new Error('empty route');
    return {
      coords: line,
      distance_m: route.distance,
      duration_s: route.duration,
      fallback: false,
    };
  } catch {
    // Фолбэк: прямая линия + оценка времени пешком (~5 км/ч).
    const dist = distanceMeters(from, to);
    return {
      coords: [
        [from.lon, from.lat],
        [to.lon, to.lat],
      ],
      distance_m: dist,
      duration_s: (dist / 1000 / 5) * 3600,
      fallback: true,
    };
  }
}

export function formatDuration(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60));
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}
