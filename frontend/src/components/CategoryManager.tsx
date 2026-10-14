import { useState } from 'react';
import type { Category } from '../api/types';

type Props = {
  categories: Category[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (category: Category) => Promise<void>;
};

// カテゴリの追加・削除。重複などのエラーは入力欄の近くに表示する
export default function CategoryManager({ categories, onCreate, onDelete }: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      setError(null);
      await onCreate(name.trim());
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カテゴリの追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    // 使用中のタスクはカテゴリなしに戻るため、削除前に確認する
    if (
      !window.confirm(
        `カテゴリ「${category.name}」を削除します。このカテゴリのタスクは「カテゴリなし」になります。よろしいですか?`,
      )
    ) {
      return;
    }
    try {
      setError(null);
      await onDelete(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'カテゴリの削除に失敗しました');
    }
  };

  return (
    <section className="category-manager">
      <h2>カテゴリ</h2>
      <form className="category-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="カテゴリ名(30文字まで)"
          maxLength={30}
          aria-label="カテゴリ名"
        />
        <button type="submit" disabled={!name.trim() || submitting}>
          カテゴリを追加
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {categories.length === 0 ? (
        <p className="category-empty">カテゴリはありません。</p>
      ) : (
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id} className="category-chip">
              {category.name}
              <button
                type="button"
                onClick={() => void handleDelete(category)}
                aria-label={`カテゴリ「${category.name}」を削除`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
