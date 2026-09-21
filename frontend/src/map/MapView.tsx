import { forwardRef, useState } from 'react';
import { YANDEX_API_KEY } from '../config';
import type { MapViewHandle, MapViewProps } from './mapTypes';
import MapViewYandex from './MapViewYandex';
import MapViewMapLibre from './MapViewMapLibre';

export type { MapViewHandle } from './mapTypes';

/**
 * Выбор движка карты: если задан ключ Yandex — рисуем на Яндекс.Картах
 * (вид как в Яндекс Go). Если ключ не задан ИЛИ ymaps3 не загрузился
 * (ключ ещё не активирован) — автоматически откатываемся на MapLibre,
 * чтобы карта всегда была видна.
 */
const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  const [yandexFailed, setYandexFailed] = useState(false);

  if (!YANDEX_API_KEY || yandexFailed) {
    return <MapViewMapLibre ref={ref} {...props} />;
  }
  return <MapViewYandex ref={ref} {...props} onFallback={() => setYandexFailed(true)} />;
});

export default MapView;
