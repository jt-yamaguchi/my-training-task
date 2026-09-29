// API の型定義はこのファイルに集約する

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// 一覧の並び順(GET /api/tasks の sort パラメータ)
export type TaskSort = 'ID' | 'PRIORITY';

export type Task = {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
  createdAt: string;
};

export type TaskRequest = {
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
};
