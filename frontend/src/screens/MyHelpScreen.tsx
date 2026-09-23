import type { Task } from '../types';
import TaskCard from '../components/TaskCard';
import { HeartIcon } from '../components/icons';

interface MyHelpScreenProps {
  tasks: Task[];
  onOpen: (task: Task) => void;
}

/** Задачи волонтёра «в работе» и выполненные — раздел «Моя помощь». */
export default function MyHelpScreen({ tasks, onOpen }: MyHelpScreenProps) {
  const active = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const done = tasks.filter((t) => t.status === 'COMPLETED');
  const xp = tasks
    .filter((t) => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED')
    .reduce((s, t) => s + (t.reward_xp ?? 0), 0);

  return (
    <div className="screen screen--list">
      <header className="list-header">
        <h1>Моя помощь</h1>
        <p>Просьбы, на которые вы откликнулись</p>
      </header>

      <div className="summary-row">
        <div className="summary-tile">
          <b>{active.length}</b>
          <span>в работе</span>
        </div>
        <div className="summary-tile">
          <b>{done.length}</b>
          <span>выполнено</span>
        </div>
        <div className="summary-tile">
          <b>{xp}</b>
          <span>XP ждёт</span>
        </div>
      </div>

      {active.length === 0 && done.length === 0 ? (
        <div className="empty">
          <HeartIcon width={40} height={40} />
          <p>Пока нет активных задач</p>
          <span>Откликнитесь на просьбу на карте — она появится здесь</span>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 className="list-subhead">В работе</h2>
              <div className="task-list">
                {active.map((t) => (
                  <TaskCard key={t.id} task={t} onOpen={onOpen} />
                ))}
              </div>
            </>
          )}
          {done.length > 0 && (
            <>
              <h2 className="list-subhead">Выполнено</h2>
              <div className="task-list">
                {done.map((t) => (
                  <TaskCard key={t.id} task={t} onOpen={onOpen} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
