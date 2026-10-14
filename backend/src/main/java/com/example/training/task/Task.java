package com.example.training.task;

import com.example.training.category.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * タスクエンティティ。
 * DBのtasksテーブルと1対1で対応する。APIには直接公開せずDTOに変換すること。
 */
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean done;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    /** カテゴリ(任意)。null はカテゴリなし。 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    protected Task() {
        // JPAが使用するデフォルトコンストラクタ
    }

    public Task(String title, String description, Priority priority, LocalDate dueDate, Category category) {
        this.title = title;
        this.description = description;
        this.done = false;
        this.priority = priority;
        this.dueDate = dueDate;
        this.category = category;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public boolean isDone() {
        return done;
    }

    public Priority getPriority() {
        return priority;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public Category getCategory() {
        return category;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    /**
     * タスクを更新する。
     * 完了日時は完了状態が変わったときだけ更新する(未完了→完了で now をセット、完了→未完了で null に戻す)。
     * 完了状態が変わらない編集では完了日時を維持する。
     */
    public void update(String title, String description, boolean done, Priority priority, LocalDate dueDate,
            Category category, OffsetDateTime now) {
        if (!this.done && done) {
            this.completedAt = now;
        } else if (this.done && !done) {
            this.completedAt = null;
        }
        this.title = title;
        this.description = description;
        this.done = done;
        this.priority = priority;
        this.dueDate = dueDate;
        this.category = category;
    }
}
