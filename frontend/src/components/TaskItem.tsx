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
      </label>
      {task.description && <p className="task-desc">{task.description}</p>}
      {task.dueDate && (
        <p className="task-due">
          期限: {formatDueDate(task.dueDate)}
          {task.overdue && <span className="task-overdue-label">期限切れ</span>}
        </p>
      )}
      <button type="button" className="task-delete" onClick={() => void onDelete(task.id)}>
        削除
      </button>
    </li>
  );
}
