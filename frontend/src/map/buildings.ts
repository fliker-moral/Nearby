import type { Map as MLMap } from 'maplibre-gl';

/**
 * Добавляет слой 3D-экструзии зданий. OpenFreeMap отдаёт высоты в
 * source-layer "building" (поля render_height / render_min_height).
 * Слой вставляем под первый symbol-слой, чтобы подписи оставались поверх.
 */
export function add3DBuildings(map: MLMap): void {
  if (map.getLayer('nearby-3d-buildings')) return;

  const style = map.getStyle();
  const source = style.sources?.openmaptiles
    ? 'openmaptiles'
    : Object.keys(style.sources ?? {})[0];
  if (!source) return;

  // Найдём первый слой с текстом, чтобы здания встали под подписями улиц.
  let firstSymbolId: string | undefined;
  for (const layer of style.layers ?? []) {
    if (layer.type === 'symbol') {
      firstSymbolId = layer.id;
      break;
    }
  }

  map.addLayer(
    {
      id: 'nearby-3d-buildings',
      source,
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 13,
      paint: {
        // Цвет по высоте: у земли светлее, выше — прохладнее.
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'render_height'], 4],
          0,
          '#e9edf5',
          40,
          '#d3d9e6',
          120,
          '#b9c2d6',
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          13,
          0,
          14.5,
          ['coalesce', ['get', 'render_height'], 6],
        ],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.9,
      },
    },
    firstSymbolId,
  );
}
