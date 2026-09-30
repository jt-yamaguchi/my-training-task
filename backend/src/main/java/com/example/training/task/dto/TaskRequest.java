package com.example.training.task.dto;

import com.example.training.task.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * タスクの作成・更新リクエスト。
 * バリデーションはこのDTOにBean Validationで記述する。
 * priority は未指定(null)の場合「中」として扱う。
 */
public record TaskRequest(
        @NotBlank(message = "タイトルは必須です")
        @Size(max = 100, message = "タイトルは100文字以内で入力してください")
        String title,

        @Size(max = 500, message = "説明は500文字以内で入力してください")
        String description,

        boolean done,

        Priority priority
) {

    /** 未指定の場合は「中」を返す。 */
    public Priority priorityOrDefault() {
        return priority != null ? priority : Priority.MEDIUM;
    }
}
