import { forwardRef } from 'react';
import { YANDEX_API_KEY } from '../config';
import type { MapViewHandle, MapViewProps } from './mapTypes';
import MapViewYandex from './MapViewYandex';
import MapViewMapLibre from './MapViewMapLibre';

export type { MapViewHandle } from './mapTypes';

/**
 * Выбор движка карты: если задан ключ Yandex — рисуем на Яндекс.Картах
 * (вид как в Яндекс Go), иначе откатываемся на MapLibre (без ключа).
 */
const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(props, ref) {
  return YANDEX_API_KEY ? (
    <MapViewYandex ref={ref} {...props} />
  ) : (
    <MapViewMapLibre ref={ref} {...props} />
  );
});

export default MapView;
