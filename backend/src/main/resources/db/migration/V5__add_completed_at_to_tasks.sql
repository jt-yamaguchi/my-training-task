-- タスクに完了日時を追加(H2 PostgreSQL互換モードでも動く構文で書くこと)
-- 任意項目のためNULL許容。既存の完了済みタスクは完了日時不明(NULL)とする
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
-- 完了日時を持つのは完了済みタスクのみ(既存の完了済みタスクがNULLのため逆方向は強制しない)
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_completed_at CHECK (completed_at IS NULL OR done = TRUE);
