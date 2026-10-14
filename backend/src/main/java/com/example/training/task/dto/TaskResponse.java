package com.example.training.task.dto;

import com.example.training.category.dto.CategoryResponse;
import com.example.training.task.Priority;
import com.example.training.task.Task;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * タスクのレスポンス。エンティティからの変換はfromメソッドに集約する。
 * overdue(期限切れ)は業務ルールのためServiceで判定した結果を受け取る。
 * completedAt(完了日時)はサーバー側でセットした値。未完了、または完了日時不明の既存タスクは null。
 * category はカテゴリなしの場合 null。
 */
public record TaskResponse(
        Long id,
        String title,
        String description,
        boolean done,
        Priority priority,
        LocalDate dueDate,
        boolean overdue,
        CategoryResponse category,
        OffsetDateTime createdAt,
        OffsetDateTime completedAt
) {

    public static TaskResponse from(Task task, boolean overdue) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isDone(),
                task.getPriority(),
                task.getDueDate(),
                overdue,
                task.getCategory() != null ? CategoryResponse.from(task.getCategory()) : null,
                task.getCreatedAt(),
                task.getCompletedAt()
        );
    }
}
