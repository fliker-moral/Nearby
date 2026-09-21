import type { LngLat, Task } from '../types';
import TaskCard from '../components/TaskCard';
import { BookmarkIcon } from '../components/icons';

interface FavoritesScreenProps {
  tasks: Task[];
  userLocation: LngLat | null;
  onOpen: (task: Task) => void;
}

export default function FavoritesScreen({
  tasks,
  userLocation,
  onOpen,
}: FavoritesScreenProps) {
  return (
    <div className="screen screen--list">
      <header className="list-header">
        <h1>Избранное</h1>
        <p>Заявки, которые вы сохранили, чтобы вернуться позже</p>
      </header>

      {tasks.length === 0 ? (
        <div className="empty">
          <BookmarkIcon width={40} height={40} />
          <p>Здесь пока пусто</p>
          <span>Открывайте заявку на карте и жмите «в избранное»</span>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} userLocation={userLocation} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
