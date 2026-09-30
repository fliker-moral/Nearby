import { useEffect, useRef, useState } from 'react';
import maplibregl, { type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_CENTER, MAP_STYLE_URL } from '../config';

export interface MapPoint {
  lat: number;
  lon: number;
}

interface AddressMapPickerProps {
  initialPoint?: MapPoint;
  onCancel: () => void;
  onChoose: (point: MapPoint) => void;
}

export default function AddressMapPicker({ initialPoint, onCancel, onChoose }: AddressMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<Marker | null>(null);
  const initialLat = initialPoint?.lat;
  const initialLon = initialPoint?.lon;
  const [point, setPoint] = useState<MapPoint | null>(initialPoint ?? null);

  useEffect(() => {
    if (!containerRef.current) return;
    const center: [number, number] = initialPoint
      ? [initialPoint.lon, initialPoint.lat]
      : DEFAULT_CENTER;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center,
      zoom: initialPoint ? 16 : 12,
      attributionControl: { compact: true },
    });
    if (initialPoint) {
      markerRef.current = new maplibregl.Marker({ color: '#1d4ed8' })
        .setLngLat([initialPoint.lon, initialPoint.lat])
        .addTo(map);
    }

    map.on('click', (event) => {
      const next = { lat: event.lngLat.lat, lon: event.lngLat.lng };
      setPoint(next);
      if (!markerRef.current) markerRef.current = new maplibregl.Marker({ color: '#1d4ed8' });
      markerRef.current.setLngLat([next.lon, next.lat]).addTo(map);
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
    };
  }, [initialLat, initialLon]);

  return (
    <section className="a-map-picker" aria-label="Выбор места на карте">
      <header className="a-map-picker__head">
        <button type="button" className="a-icon-btn" onClick={onCancel}>‹ Назад</button>
        <b>Выберите место</b>
        <span className="a-map-picker__spacer" />
      </header>
      <div className="a-map-picker__map" ref={containerRef} />
      <div className="a-map-picker__footer">
        <span>{point ? 'Место отмечено на карте' : 'Нажмите на карту, чтобы отметить место'}</span>
        <button type="button" className="a-btn a-btn--primary" disabled={!point} onClick={() => point && onChoose(point)}>
          Выбрать это место
        </button>
      </div>
    </section>
  );
}
