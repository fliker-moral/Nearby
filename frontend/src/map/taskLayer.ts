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

function pinIconId(kind: string): string {
  return `pin-${kind}`;
}

/** Регистрирует кастомные иконки-метки (PNG из /public/pins) для всех подкатегорий. */
export async function registerPinImages(map: MLMap): Promise<void> {
  const jobs = Object.keys(KIND_META).map(async (kind) => {
    const id = pinIconId(kind);
    if (map.hasImage(id)) return;
    try {
      const img = await map.loadImage(`pins/${kind}.png`);
      if (!map.hasImage(id)) map.addImage(id, img.data, { pixelRatio: 2.3 });
    } catch (e) {
      console.warn('не удалось загрузить метку', kind, e);
    }
  });
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
          dim: !available && !mine,
          selected: t.id === selectedId,
          icon: pinIconId(t.kind),
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
        'icon-size': ['case', ['==', ['get', 'selected'], true], 1.2, 1],
      },
      paint: {
        'icon-opacity': ['case', ['==', ['get', 'dim'], true], 0.5, 1],
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
