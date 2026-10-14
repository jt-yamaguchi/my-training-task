// タスクAPIクライアント。
// コンポーネントから直接 fetch せず、必ずこのモジュールを経由する。
// URLは相対パス /api/... のみ(絶対URLの記述は禁止。CLAUDE.md参照)
import { handleResponse } from './http';
import type { Task, TaskRequest, TaskSort } from './types';

// categoryId を指定するとそのカテゴリのタスクだけを取得する(null = すべて)
export async function fetchTasks(
  sort: TaskSort = 'ID',
  categoryId: number | null = null,
): Promise<Task[]> {
  const query = categoryId === null ? `sort=${sort}` : `sort=${sort}&categoryId=${categoryId}`;
  const res = await fetch(`/api/tasks?${query}`);
  return handleResponse<Task[]>(res);
}

export async function createTask(request: TaskRequest): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Task>(res);
}

export async function updateTask(id: number, request: TaskRequest): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Task>(res);
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}
