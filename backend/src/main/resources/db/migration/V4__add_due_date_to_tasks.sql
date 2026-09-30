-- タスクに期限を追加(H2 PostgreSQL互換モードでも動く構文で書くこと)
-- 任意項目のためNULL許容。既存タスクは期限なし(NULL)になる
ALTER TABLE tasks ADD COLUMN due_date DATE;
