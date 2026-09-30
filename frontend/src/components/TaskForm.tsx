import { useState } from 'react';
import type { Priority } from '../api/types';
import { PRIORITIES, PRIORITY_LABELS } from '../priority';

type Props = {
  onSubmit: (title: string, description: string, priority: Priority) => Promise<void>;
};

export default function TaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), description.trim(), priority);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
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
        placeholder="タスク名(必須・100文字まで)"
        maxLength={100}
        aria-label="タスク名"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
      <button type="submit" disabled={!title.trim() || submitting}>
        追加する
      </button>
    </form>
  );
}
