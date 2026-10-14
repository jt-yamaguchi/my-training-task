// API の型定義はこのファイルに集約する

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// 一覧の並び順(GET /api/tasks の sort パラメータ)
export type TaskSort = 'ID' | 'PRIORITY';

export type Category = {
  id: number;
  name: string;
};

export type CategoryRequest = {
  name: string;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
  // 期限("yyyy-MM-dd")。null = 期限なし
  dueDate: string | null;
  // 期限切れ(期限が今日より前かつ未完了)。判定はAPI側で行う
  overdue: boolean;
  // カテゴリ。null = カテゴリなし
  category: Category | null;
  createdAt: string;
  // 完了日時(ISO 8601、オフセット付き)。サーバー側でセットする。null = 未完了または完了日時不明
  completedAt: string | null;
};

export type TaskRequest = {
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
  dueDate: string | null;
  // null = カテゴリなし(更新時に null を送るとカテゴリを解除する)
  categoryId: number | null;
};
