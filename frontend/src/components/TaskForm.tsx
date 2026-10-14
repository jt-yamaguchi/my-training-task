import { useState } from 'react';
import type { Category, Priority } from '../api/types';
import { PRIORITIES, PRIORITY_LABELS } from '../priority';

type Props = {
  categories: Category[];
  onSubmit: (
    title: string,
    description: string,
    priority: Priority,
    dueDate: string,
    categoryId: number | null,
  ) => Promise<void>;
};

export default function TaskForm({ categories, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  // 期限は任意。未入力は空文字
  const [dueDate, setDueDate] = useState('');
  // カテゴリは任意。空文字 = カテゴリなし
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 選択中のカテゴリが削除された場合はカテゴリなしとして扱う
  const selectedCategoryId = categories.some((c) => String(c.id) === categoryId) ? categoryId : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(
        title.trim(),
        description.trim(),
        priority,
        dueDate,
        selectedCategoryId === '' ? null : Number(selectedCategoryId),
      );
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setCategoryId('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="task-form-wide"
        placeholder="タスク名(必須・100文字まで)"
        maxLength={100}
        aria-label="タスク名"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="task-form-wide"
        placeholder="説明(任意)"
        maxLength={500}
        aria-label="説明"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        aria-label="優先度"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            優先度: {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="期限"
      />
      <select
        value={selectedCategoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        aria-label="カテゴリ"
      >
        <option value="">カテゴリなし</option>
        {categories.map((c) => (
          <option key={c.id} value={String(c.id)}>
            {c.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!title.trim() || submitting}>
        追加する
      </button>
    </form>
  );
}
