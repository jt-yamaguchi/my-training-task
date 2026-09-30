// カテゴリAPIクライアント。
// コンポーネントから直接 fetch せず、必ずこのモジュールを経由する。
// URLは相対パス /api/... のみ(絶対URLの記述は禁止。CLAUDE.md参照)
import { handleResponse } from './http';
import type { Category, CategoryRequest } from './types';

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  return handleResponse<Category[]>(res);
}

export async function createCategory(request: CategoryRequest): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Category>(res);
}

// 使用中のカテゴリも削除できる(該当タスクはカテゴリなしに戻る)
export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}
