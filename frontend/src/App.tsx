import { useCallback, useEffect, useState } from 'react';
import { createCategory, deleteCategory, fetchCategories } from './api/categories';
import { createTask, deleteTask, fetchTasks, updateTask } from './api/tasks';
import type { Category, Priority, Task, TaskSort } from './api/types';
import CategoryManager from './components/CategoryManager';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<TaskSort>('ID');
  const [categories, setCategories] = useState<Category[]>([]);
  // 一覧の絞り込み。null = すべて
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTasks(await fetchTasks(sort, categoryFilter));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [sort, categoryFilter]);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await fetchCategories());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'カテゴリの取得に失敗しました');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreate = async (
    title: string,
    description: string,
    priority: Priority,
    dueDate: string,
    categoryId: number | null,
  ) => {
    await createTask({
      title,
      description: description || null,
      done: false,
      priority,
      dueDate: dueDate || null,
      categoryId,
    });
    await load();
  };

  const handleToggle = async (task: Task) => {
    await updateTask(task.id, {
      title: task.title,
      description: task.description,
      done: !task.done,
      priority: task.priority,
      dueDate: task.dueDate,
      categoryId: task.category?.id ?? null,
    });
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    await load();
  };

  const handleCreateCategory = async (name: string) => {
    await createCategory({ name });
    await loadCategories();
  };

  const handleDeleteCategory = async (category: Category) => {
    await deleteCategory(category.id);
    await loadCategories();
    if (categoryFilter === category.id) {
      // 絞り込み中のカテゴリを削除した場合は「すべて」に戻す(変更により一覧は再取得される)
      setCategoryFilter(null);
    } else {
      // 削除したカテゴリのタスクはカテゴリなしになるため、一覧を再取得する
      await load();
    }
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <main className="container">
      <header className="header">
        <h1>タスク管理</h1>
        <p className="header-note">残り {remaining} 件</p>
      </header>

      <TaskForm categories={categories} onSubmit={handleCreate} />

      <div className="toolbar">
        <select
          value={categoryFilter ?? ''}
          onChange={(e) => setCategoryFilter(e.target.value === '' ? null : Number(e.target.value))}
          aria-label="カテゴリで絞り込み"
        >
          <option value="">すべて</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as TaskSort)}
          aria-label="並び順"
        >
          <option value="ID">登録順</option>
          <option value="PRIORITY">優先度順</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="empty">読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p className="empty">タスクはありません。上のフォームから追加してください。</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </ul>
      )}

      <CategoryManager
        categories={categories}
        onCreate={handleCreateCategory}
        onDelete={handleDeleteCategory}
      />
    </main>
  );
}
