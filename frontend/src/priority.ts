// 優先度の表示名。API の値(HIGH/MEDIUM/LOW)を画面表示用に変換する
import type { Priority } from './api/types';

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

// 選択肢の表示順(高 → 中 → 低)
export const PRIORITIES: Priority[] = ['HIGH', 'MEDIUM', 'LOW'];
