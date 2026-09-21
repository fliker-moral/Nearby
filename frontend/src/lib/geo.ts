import type { LngLat } from '../types';

/** Расстояние между двумя точками (формула гаверсинуса), метры. */
export function distanceMeters(a: LngLat, b: LngLat): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Человекочитаемое расстояние: «120 м» / «1,4 км». */
export function formatDistance(m: number): string {
  if (m < 950) return `${Math.round(m / 10) * 10} м`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} км`;
}

/** «40 мин» / «1 ч 30 мин». */
export function formatEta(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}
