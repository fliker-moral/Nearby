import type { Map as MLMap, GeoJSONSource, MapGeoJSONFeature } from 'maplibre-gl';
import { KIND_META, MODE_COLOR } from '../config';
import type { Task } from '../types';

export const HALO_LAYER = 'task-halo';
export const PIN_LAYER = 'task-pins';
const SOURCE = 'tasks';

function kindColor(kind: string): string {
  const meta = KIND_META[kind];
  return MODE_COLOR[meta ? meta.mode : 'help'];
}
function kindEmoji(kind: string): string {
  return KIND_META[kind]?.emoji ?? '📍';
}

/** Рисуем пин-«каплю» с иконкой подкатегории. */
async function makePinImage(color: string, emoji: string, muted: boolean): Promise<ImageData> {
  const W = 44;
  const H = 56;
  const dpr = 2;
  const fill = muted ? '#aab3c2' : color;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>` +
    `<path d='M22 3 C13 3 6 10 6 19 C6 31 22 52 22 52 C22 52 38 31 38 19 C38 10 31 3 22 3 Z' ` +
    `fill='${fill}' stroke='white' stroke-width='3'/>` +
    `<circle cx='22' cy='19' r='10' fill='white'/></svg>`;

  const img = new Image(W, H);
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();

  const cvs = document.createElement('canvas');
  cvs.width = W * dpr;
  cvs.height = H * dpr;
  const ctx = cvs.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.drawImage(img, 0, 0, W, H);
  ctx.font = '14px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = muted ? 0.8 : 1;
  ctx.fillText(emoji, 22, 19);

  return ctx.getImageData(0, 0, W * dpr, H * dpr);
}

function pinIconId(kind: string, muted: boolean): string {
  return `pin-${kind}${muted ? '-muted' : ''}`;
}

/** Регистрирует иконки для всех подкатегорий (обычные + приглушённые). */
export async function registerPinImages(map: MLMap): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const kind of Object.keys(KIND_META)) {
    for (const muted of [false, true]) {
      const id = pinIconId(kind, muted);
      if (map.hasImage(id)) continue;
      jobs.push(
        makePinImage(kindColor(kind), kindEmoji(kind), muted).then((data) => {
          if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: 2 });
        }),
      );
    }
  }
  await Promise.all(jobs);
}

function toFeatureCollection(tasks: Task[], selectedId: string | null) {
  return {
    type: 'FeatureCollection' as const,
    features: tasks.map((t) => {
      const available = t.status === 'PUBLISHED';
      const mine = t.status === 'IN_PROGRESS';
      return {
        type: 'Feature' as const,
        id: t.id,
        geometry: { type: 'Point' as const, coordinates: [t.lon, t.lat] },
        properties: {
          id: t.id,
          available,
          selected: t.id === selectedId,
          icon: pinIconId(t.kind, !available && !mine),
          color: kindColor(t.kind),
        },
      };
    }),
  };
}

export function addTaskLayers(
  map: MLMap,
  tasks: Task[],
  onSelect: (id: string) => void,
): void {
  if (!map.getSource(SOURCE)) {
    map.addSource(SOURCE, {
      type: 'geojson',
      data: toFeatureCollection(tasks, null),
      promoteId: 'id',
    });
  }

  if (!map.getLayer(HALO_LAYER)) {
    map.addLayer({
      id: HALO_LAYER,
      type: 'circle',
      source: SOURCE,
      filter: ['==', ['get', 'available'], true],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 15, 18, 22],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.16,
        'circle-blur': 0.6,
        'circle-translate': [0, -30],
        'circle-translate-anchor': 'viewport',
      },
    });
  }

  if (!map.getLayer(PIN_LAYER)) {
    map.addLayer({
      id: PIN_LAYER,
      type: 'symbol',
      source: SOURCE,
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-size': ['case', ['==', ['get', 'selected'], true], 1.25, 1],
      },
    });

    map.on('click', PIN_LAYER, (e) => {
      const f = e.features?.[0] as MapGeoJSONFeature | undefined;
      const id = f?.properties?.id as string | undefined;
      if (id) onSelect(id);
    });
    map.on('mouseenter', PIN_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', PIN_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });
  }
}

export function updateTaskData(map: MLMap, tasks: Task[], selectedId: string | null): void {
  const src = map.getSource(SOURCE) as GeoJSONSource | undefined;
  src?.setData(toFeatureCollection(tasks, selectedId));
}
