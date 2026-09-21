import type { LngLat, Task } from '../types';
import TaskCard from '../components/TaskCard';
import { RouteIcon } from '../components/icons';

interface RoutesScreenProps {
  tasks: Task[];
  userLocation: LngLat | null;
  onOpen: (task: Task) => void;
}

/** Задачи волонтёра «в работе» — его текущие маршруты на сегодня. */
export default function RoutesScreen({ tasks, userLocation, onOpen }: RoutesScreenProps) {
  const active = tasks.filter((t) => t.status === 'IN_PROGRESS');

  return (
    <div className="screen screen--list">
      <header className="list-header">
        <h1>Мои маршруты</h1>
        <p>Задачи, которые вы взяли в работу</p>
      </header>

      {active.length === 0 ? (
        <div className="empty">
          <RouteIcon width={40} height={40} />
          <p>Активных задач нет</p>
          <span>Возьмите заявку на карте — она появится здесь</span>
        </div>
      ) : (
        <>
          <div className="route-summary">
            <div className="route-summary__item">
              <b>{active.length}</b>
              <span>в работе</span>
            </div>
            <div className="route-summary__item">
              <b>{active.reduce((s, t) => s + (t.reward_points ?? 0), 0)}</b>
              <span>баллов ждёт</span>
            </div>
            <div className="route-summary__item">
              <b>{active.reduce((s, t) => s + (t.eta_minutes ?? 0), 0)}</b>
              <span>минут пути</span>
            </div>
          </div>
          <div className="task-list">
            {active.map((t) => (
              <TaskCard key={t.id} task={t} userLocation={userLocation} onOpen={onOpen} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
