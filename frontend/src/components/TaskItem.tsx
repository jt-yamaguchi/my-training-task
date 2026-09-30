import type { Task } from '../api/types';
import { PRIORITY_LABELS } from '../priority';

type Props = {
  task: Task;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

// "2026-10-15" → "2026/10/15"(Date に変換するとタイムゾーンで日付がずれるため文字列のまま扱う)
function formatDueDate(dueDate: string): string {
  return dueDate.split('-').join('/');
}

// "2026-09-30T14:05:12+09:00" → "2026/09/30 14:05"(日時はブラウザのタイムゾーンで表示する)
function formatCompletedAt(completedAt: string): string {
  const date = new Date(completedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const classNames = ['task-item'];
  if (task.done) {
    classNames.push('done');
  }
  if (task.overdue) {
    classNames.push('overdue');
  }

  return (
    <li className={classNames.join(' ')}>
      <label className="task-check">
        <input type="checkbox" checked={task.done} onChange={() => void onToggle(task)} />
        <span className={`task-priority priority-${task.priority.toLowerCase()}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <span className="task-title">{task.title}</span>
        {task.category && <span className="task-category">{task.category.name}</span>}
      </label>
      {task.description && <p className="task-desc">{task.description}</p>}
      {task.dueDate && (
        <p className="task-due">
          期限: {formatDueDate(task.dueDate)}
          {task.overdue && <span className="task-overdue-label">期限切れ</span>}
        </p>
      )}
      {task.completedAt && (
        <p className="task-completed">完了: {formatCompletedAt(task.completedAt)}</p>
      )}
      <button type="button" className="task-delete" onClick={() => void onDelete(task.id)}>
        削除
      </button>
    </li>
  );
}
