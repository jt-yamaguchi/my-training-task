-- カテゴリテーブルを追加し、タスクから任意で1つ参照する(H2 PostgreSQL互換モードでも動く構文で書くこと)
CREATE TABLE categories (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    CONSTRAINT uq_categories_name UNIQUE (name)
);

-- 任意項目のためNULL許容。既存タスクはカテゴリなし(NULL)になる
ALTER TABLE tasks ADD COLUMN category_id BIGINT;
-- 使用中のカテゴリを削除した場合、タスクはカテゴリなし(NULL)に戻す
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_category
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL;
-- カテゴリでの絞り込みと、カテゴリ削除時の SET NULL で使う
CREATE INDEX idx_tasks_category_id ON tasks (category_id);
