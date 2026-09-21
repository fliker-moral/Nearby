import { useEffect, useMemo, useRef, useState } from 'react';

import type { MapViewHandle } from './map/MapView';
import MapScreen from './screens/MapScreen';
import MyHelpScreen from './screens/MyHelpScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav, { type Tab } from './components/BottomNav';
import Toast, { type ToastData } from './components/Toast';

import { useTasks } from './hooks/useTasks';
import { initMax, haptic } from './lib/maxBridge';
import { KIND_META, type Mode } from './config';
import type { LngLat, Task } from './types';

function taskMode(t: Task): Mode {
  return KIND_META[t.kind]?.mode ?? 'help';
}

export default function App() {
  const { tasks, source, assign } = useTasks();
  const mapRef = useRef<MapViewHandle>(null);

  const [tab, setTab] = useState<Tab>('map');
  const [mode, setMode] = useState<Mode>('help');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<string | 'ALL'>('ALL');
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    initMax();
  }, []);

  useEffect(() => {
    if (tab === 'map') requestAnimationFrame(() => mapRef.current?.resize());
  }, [tab]);

  const showToast = (message: string, kind: ToastData['kind']) =>
    setToast({ id: Date.now(), message, kind });

  const modeTasks = useMemo(
    () => tasks.filter((t) => taskMode(t) === mode),
    [tasks, mode],
  );

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modeTasks.filter((t) => {
      if (kind !== 'ALL' && t.kind !== kind) return false;
      if (q && !`${t.title} ${t.address_text}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [modeTasks, kind, search]);

  // В режиме «помощь» всегда показываем карточку-peek: по умолчанию — ближайшая свободная.
  useEffect(() => {
    if (mode !== 'help') return;
    if (selectedId && modeTasks.some((t) => t.id === selectedId)) return;
    const first = modeTasks.find((t) => t.status === 'PUBLISHED') ?? modeTasks[0];
    setSelectedId(first?.id ?? null);
  }, [mode, modeTasks, selectedId]);

  const selected = useMemo(
    () => (selectedId ? tasks.find((t) => t.id === selectedId) ?? null : null),
    [selectedId, tasks],
  );

  const changeMode = (m: Mode) => {
    setMode(m);
    setKind('ALL');
    setSheetExpanded(false);
    if (m === 'events') setSelectedId(null);
  };

  const openTask = (t: Task) => {
    setSelectedId(t.id);
    setSheetExpanded(false);
    haptic('tap');
    if (tab !== 'map') setTab('map');
    requestAnimationFrame(() => mapRef.current?.flyTo({ lon: t.lon, lat: t.lat }));
  };

  const handleAssign = async (t: Task) => {
    setAssigning(true);
    const result = await assign(t);
    setAssigning(false);
    if (result === 'ok') {
      haptic('success');
      setSheetExpanded(false);
      showToast('Спасибо за отклик! Задача в разделе «Моя помощь»', 'success');
    } else if (result === 'conflict') {
      haptic('error');
      showToast('Эту просьбу уже взял другой волонтёр', 'error');
    } else {
      haptic('error');
      showToast('Не удалось откликнуться, попробуйте ещё раз', 'error');
    }
  };

  const myTasks = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED',
  );
  const activeCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

  return (
    <div className="app">
      <div className={`screen-slot${tab === 'map' ? '' : ' screen-slot--hidden'}`}>
        <MapScreen
          ref={mapRef}
          mode={mode}
          visibleTasks={visibleTasks}
          selected={mode === 'help' ? selected : null}
          sheetExpanded={sheetExpanded}
          userLocation={userLocation}
          search={search}
          kind={kind}
          source={source}
          assigning={assigning}
          onMode={changeMode}
          onSearch={setSearch}
          onKind={setKind}
          onSelectTask={openTask}
          onUserLocation={setUserLocation}
          onToggleExpand={() => setSheetExpanded((v) => !v)}
          onCloseSheet={() => setSheetExpanded(false)}
          onAssign={handleAssign}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onLocate={() => mapRef.current?.locate()}
        />
      </div>

      {tab === 'myhelp' && <MyHelpScreen tasks={myTasks} onOpen={openTask} />}
      {tab === 'profile' && <ProfileScreen tasks={tasks} />}

      <Toast toast={toast} onDone={() => setToast(null)} />

      <BottomNav active={tab} badges={{ myhelp: activeCount }} onChange={setTab} />
    </div>
  );
}
