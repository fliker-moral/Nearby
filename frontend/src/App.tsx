import { useEffect, useMemo, useRef, useState } from 'react';

import type { MapViewHandle } from './map/MapView';
import MapScreen from './screens/MapScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import RoutesScreen from './screens/RoutesScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav, { type Tab } from './components/BottomNav';
import TaskSheet from './components/TaskSheet';
import Toast, { type ToastData } from './components/Toast';
import type { CategoryValue } from './components/CategoryFilter';

import { useTasks } from './hooks/useTasks';
import { useFavorites } from './hooks/useFavorites';
import { initMax, haptic } from './lib/maxBridge';
import type { LngLat, Task } from './types';

export default function App() {
  const { tasks, source, assign } = useTasks();
  const favorites = useFavorites();
  const mapRef = useRef<MapViewHandle>(null);

  const [tab, setTab] = useState<Tab>('map');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryValue>('ALL');
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    initMax();
  }, []);

  // Пересинхронизируем размер карты при возврате на вкладку «Карта».
  useEffect(() => {
    if (tab === 'map') requestAnimationFrame(() => mapRef.current?.resize());
  }, [tab]);

  // Держим открытую карточку в актуальном статусе.
  const liveSelected = useMemo(
    () => (selected ? tasks.find((t) => t.id === selected.id) ?? selected : null),
    [selected, tasks],
  );

  const showToast = (message: string, kind: ToastData['kind']) =>
    setToast({ id: Date.now(), message, kind });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (category !== 'ALL' && t.category !== category) return false;
      if (q && !(`${t.title} ${t.address_text}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [tasks, category, search]);

  const openTask = (task: Task) => {
    setSelected(task);
    if (tab !== 'map') setTab('map');
    haptic('tap');
    requestAnimationFrame(() =>
      mapRef.current?.flyTo({ lon: task.lon, lat: task.lat }),
    );
  };

  const handleAssign = async (task: Task) => {
    setAssigning(true);
    const result = await assign(task);
    setAssigning(false);
    if (result === 'ok') {
      haptic('success');
      showToast('Задача у вас! Она в разделе «Маршруты»', 'success');
    } else if (result === 'conflict') {
      haptic('error');
      showToast('Эту задачу уже взял другой волонтёр', 'error');
    } else {
      haptic('error');
      showToast('Не удалось взять задачу, попробуйте ещё раз', 'error');
    }
  };

  const toggleFavorite = (task: Task) => {
    favorites.toggle(task.id);
    showToast(
      favorites.has(task.id) ? 'Убрано из избранного' : 'Добавлено в избранное',
      'info',
    );
  };

  const favTasks = tasks.filter((t) => favorites.has(t.id));
  const activeCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

  return (
    <div className="app">
      <div className={`screen-slot${tab === 'map' ? '' : ' screen-slot--hidden'}`}>
        <MapScreen
          ref={mapRef}
          tasks={filtered}
          allTasks={tasks}
          selectedId={liveSelected?.id ?? null}
          userLocation={userLocation}
          search={search}
          category={category}
          source={source}
          onSearch={setSearch}
          onCategory={setCategory}
          onSelectTask={openTask}
          onUserLocation={setUserLocation}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onLocate={() => mapRef.current?.locate()}
        />
      </div>

      {tab === 'favorites' && (
        <FavoritesScreen tasks={favTasks} userLocation={userLocation} onOpen={openTask} />
      )}
      {tab === 'routes' && (
        <RoutesScreen tasks={tasks} userLocation={userLocation} onOpen={openTask} />
      )}
      {tab === 'profile' && <ProfileScreen tasks={tasks} />}

      {liveSelected && (
        <TaskSheet
          task={liveSelected}
          userLocation={userLocation}
          isFavorite={favorites.has(liveSelected.id)}
          assigning={assigning}
          onClose={() => setSelected(null)}
          onAssign={handleAssign}
          onToggleFavorite={toggleFavorite}
          onRoute={(t) => {
            setSelected(null);
            setTab('routes');
            void t;
          }}
        />
      )}

      <Toast toast={toast} onDone={() => setToast(null)} />

      <BottomNav
        active={tab}
        badges={{ favorites: favTasks.length, routes: activeCount }}
        onChange={setTab}
      />
    </div>
  );
}
