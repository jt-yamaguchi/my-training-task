-- タスクに優先度を追加(H2 PostgreSQL互換モードでも動く構文で書くこと)
-- 既存タスクは「中」(MEDIUM)になる
ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_priority CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'));
