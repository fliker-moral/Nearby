import { useEffect, useMemo, useRef, useState } from 'react';

import type { MapViewHandle } from './map/MapView';
import MapScreen from './screens/MapScreen';
import MyHelpScreen from './screens/MyHelpScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav, { type Tab } from './components/BottomNav';
import Toast, { type ToastData } from './components/Toast';
import RoleRegistration from './components/RoleRegistration';
import type { UserLocationFilter } from './components/LocationFilter';

import ApplicantApp from './applicant/ApplicantApp';
import { useTasks } from './hooks/useTasks';
import { listNotificationFilters, saveNotificationFilter, suggestAddresses, updateMyRole } from './api/client';
import { getCurrentUser, initMax, haptic } from './lib/maxBridge';
import { fetchWalkingRoute, type RouteResult } from './lib/routing';
import { DEFAULT_CENTER, KIND_META, type Mode } from './config';
import type { LngLat, Task } from './types';

function taskMode(t: Task): Mode {
  return KIND_META[t.kind]?.mode ?? 'help';
}

type Role = 'volunteer' | 'applicant';

function locationPreferenceKey(): string {
  const maxId = typeof localStorage === 'undefined' ? null : localStorage.getItem('nearby.maxId');
  const userId = getCurrentUser().id;
  return `nearby.location.${userId || maxId || 'local'}`;
}

function coverLetterPreferenceKey(): string {
  const maxId = typeof localStorage === 'undefined' ? null : localStorage.getItem('nearby.maxId');
  const userId = getCurrentUser().id;
  return `nearby.cover-letter.${userId || maxId || 'local'}`;
}

function readLocationPreference(): UserLocationFilter {
  try {
    const saved = JSON.parse(localStorage.getItem(locationPreferenceKey()) ?? '{}') as Partial<UserLocationFilter>;
    return { city: saved.city ?? '', district: saved.district ?? '' };
  } catch {
    return { city: '', district: '' };
  }
}

export default function App() {
  const [role, setRole] = useState<Role>(() => {
    try {
      return (localStorage.getItem('nearby.role') as Role) || 'volunteer';
    } catch {
      return 'volunteer';
    }
  });
  const [registered, setRegistered] = useState(() => {
    try {
      return localStorage.getItem('nearby.registration-complete') === 'true';
    } catch {
      return false;
    }
  });

  const [toast, setToast] = useState<ToastData | null>(null);

  const switchRole = (r: Role) => {
    const firstSelection = !registered;
    try {
      localStorage.setItem('nearby.role', r);
      localStorage.setItem('nearby.registration-complete', 'true');
    } catch {
      /* ignore */
    }
    setRole(r);
    setRegistered(true);
    if (firstSelection) {
      showToast('Профиль можно сменить внизу раздела «Профиль».', 'info');
    }
    updateMyRole(r === 'applicant' ? 'APPLICANT' : 'VOLUNTEER').catch(() => {
      setToast({
        id: Date.now(),
        message: firstSelection
          ? 'Профиль сохранён на устройстве. Сменить его можно внизу раздела «Профиль».'
          : 'Роль сохранена на этом устройстве. Сервер регистрации сейчас недоступен.',
        kind: 'info',
      });
    });
  };

  const [location, setLocation] = useState<UserLocationFilter>(readLocationPreference);
  const [coverLetter, setCoverLetter] = useState(() => {
    try {
      return localStorage.getItem(coverLetterPreferenceKey()) ?? 'Здравствуйте! Готов(а) помочь с вашей просьбой.';
    } catch {
      return 'Здравствуйте! Готов(а) помочь с вашей просьбой.';
    }
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { tasks, source, assign, withdraw, complete } = useTasks(location.city, location.district);
  const mapRef = useRef<MapViewHandle>(null);

  const [tab, setTab] = useState<Tab>('map');
  const mode: Mode = 'help';
  const [kind, setKind] = useState<string | 'ALL'>('ALL');
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [peekDismissed, setPeekDismissed] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [routing, setRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);

  useEffect(() => {
    initMax();
  }, []);

  useEffect(() => {
    listNotificationFilters().then((subscriptions) => {
      const active = subscriptions.find((subscription) => subscription.enabled);
      if (!active) return;
      const savedLocation = readLocationPreference();
      if (!savedLocation.city) {
        const restored = { city: active.city, district: active.district ?? '' };
        setLocation(restored);
        try {
          localStorage.setItem(locationPreferenceKey(), JSON.stringify(restored));
        } catch {
          /* Location remains available for this session. */
        }
        setNotificationsEnabled(true);
      } else {
        setNotificationsEnabled(savedLocation.city === active.city && savedLocation.district === (active.district ?? ''));
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (tab === 'map') requestAnimationFrame(() => mapRef.current?.resize());
  }, [tab]);

  useEffect(() => {
    if (!location.city) return;
    const query = location.district ? `${location.district}, ${location.city}` : location.city;
    suggestAddresses(query, location.city).then((suggestions) => {
      const center = suggestions.find((item) => item.lat != null && item.lon != null);
      if (center?.lat != null && center.lon != null) {
        mapRef.current?.flyTo({ lat: center.lat, lon: center.lon }, location.district ? 13 : 11);
      }
    }).catch(() => undefined);
  }, [location.city, location.district]);

  const showToast = (message: string, kind: ToastData['kind']) =>
    setToast({ id: Date.now(), message, kind });

  const modeTasks = useMemo(
    () => tasks.filter((t) => taskMode(t) === mode),
    [tasks, mode],
  );

  const visibleTasks = useMemo(() => {
    return modeTasks.filter((t) => {
      if (kind !== 'ALL' && t.kind !== kind) return false;
      return true;
    });
  }, [modeTasks, kind]);

  const changeLocation = async (next: UserLocationFilter) => {
    setLocation(next);
    setNotificationsEnabled(false);
    try {
      localStorage.setItem(locationPreferenceKey(), JSON.stringify(next));
    } catch {
      /* The selected area remains in component state. */
    }
    try {
      await saveNotificationFilter(next.city, next.district, false);
    } catch {
      // Saving the area locally must work even when the API is temporarily unavailable.
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (!location.city) throw new Error('Сначала выберите город');
    await saveNotificationFilter(location.city, location.district, enabled);
    setNotificationsEnabled(enabled);
  };

  // В режиме «помощь» по умолчанию показываем карточку-peek ближайшей просьбы,
  // пока пользователь не смахнул её вниз (peekDismissed).
  useEffect(() => {
    if (mode !== 'help' || peekDismissed) return;
    if (selectedId && modeTasks.some((t) => t.id === selectedId)) return;
    const first = modeTasks.find((t) => t.status === 'PUBLISHED') ?? modeTasks[0];
    setSelectedId(first?.id ?? null);
  }, [mode, modeTasks, selectedId, peekDismissed]);

  const selected = useMemo(
    () => (selectedId ? tasks.find((t) => t.id === selectedId) ?? null : null),
    [selectedId, tasks],
  );

  const changeMode = (_m: Mode) => undefined;

  const clearRoute = () => {
    mapRef.current?.clearRoute();
    setRouteInfo(null);
  };

  const openTask = (t: Task) => {
    setSelectedId(t.id);
    setPeekDismissed(false);
    setSheetExpanded(false);
    clearRoute();
    haptic('tap');
    if (tab !== 'map') setTab('map');
    requestAnimationFrame(() => mapRef.current?.flyTo({ lon: t.lon, lat: t.lat }));
  };

  const dismissPeek = () => {
    setSheetExpanded(false);
    setPeekDismissed(true);
    setSelectedId(null);
    clearRoute();
    haptic('tap');
  };

  /** Текущее местоположение: из состояния, иначе геолокация, иначе центр демо. */
  const resolveLocation = (): Promise<LngLat> =>
    new Promise((resolve) => {
      if (userLocation) return resolve(userLocation);
      if (!navigator.geolocation) {
        return resolve({ lon: DEFAULT_CENTER[0], lat: DEFAULT_CENTER[1] });
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lon: pos.coords.longitude, lat: pos.coords.latitude };
          setUserLocation(p);
          resolve(p);
        },
        () => resolve({ lon: DEFAULT_CENTER[0], lat: DEFAULT_CENTER[1] }),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

  const handleRoute = async (t: Task) => {
    setRouting(true);
    const from = await resolveLocation();
    const route = await fetchWalkingRoute(from, { lon: t.lon, lat: t.lat });
    mapRef.current?.showRoute(route.coords);
    setRouteInfo(route);
    setRouting(false);
    setSheetExpanded(false);
    haptic('tap');
  };

  const handleAssign = async (t: Task, message: string) => {
    setAssigning(true);
    const result = await assign(t, message);
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

  const handleWithdraw = async (t: Task) => {
    setWithdrawing(true);
    const result = await withdraw(t);
    setWithdrawing(false);
    showToast(
      result === 'ok' ? 'Отклик отменён. Просьба снова доступна на карте.' : 'Не удалось отменить отклик. Попробуйте ещё раз.',
      result === 'ok' ? 'info' : 'error',
    );
  };

  const handleComplete = async (t: Task) => {
    setCompleting(true);
    const result = await complete(t);
    setCompleting(false);
    showToast(
      result === 'ok' ? 'Готово! Заявитель сможет подтвердить выполнение и оставить отзыв.' : 'Не удалось отметить задачу выполненной.',
      result === 'ok' ? 'success' : 'error',
    );
  };

  const handleCoverLetterChange = (value: string) => {
    setCoverLetter(value);
    try {
      localStorage.setItem(coverLetterPreferenceKey(), value);
    } catch {
      /* Письмо останется в форме до закрытия приложения. */
    }
  };

  const myTasks = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED' || t.status === 'CLOSED',
  );
  const activeCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

  if (!registered) {
    return <RoleRegistration onSelect={switchRole} />;
  }

  if (role === 'applicant') {
    return (
      <>
        <ApplicantApp onSwitchRole={() => switchRole('volunteer')} />
        <Toast toast={toast} onDone={() => setToast(null)} />
      </>
    );
  }

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
          location={location}
          notificationsEnabled={notificationsEnabled}
          kind={kind}
          source={source}
          assigning={assigning}
          withdrawing={withdrawing}
          completing={completing}
          coverLetter={coverLetter}
          onCoverLetterChange={handleCoverLetterChange}
          routing={routing}
          routeInfo={routeInfo}
          onMode={changeMode}
          onLocationChange={changeLocation}
          onToggleNotifications={toggleNotifications}
          onKind={setKind}
          onSelectTask={openTask}
          onUserLocation={setUserLocation}
          onToggleExpand={() => setSheetExpanded((v) => !v)}
          onCloseSheet={() => setSheetExpanded(false)}
          onDismissSheet={dismissPeek}
          onAssign={handleAssign}
          onWithdraw={handleWithdraw}
          onComplete={handleComplete}
          onRoute={handleRoute}
          onClearRoute={clearRoute}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onLocate={() => mapRef.current?.locate()}
        />
      </div>

      {tab === 'myhelp' && <MyHelpScreen tasks={myTasks} onOpen={openTask} />}
      {tab === 'profile' && (
        <ProfileScreen tasks={tasks} onSwitchRole={() => switchRole('applicant')} />
      )}

      <Toast toast={toast} onDone={() => setToast(null)} />

      <BottomNav active={tab} badges={{ myhelp: activeCount }} onChange={setTab} />
    </div>
  );
}
