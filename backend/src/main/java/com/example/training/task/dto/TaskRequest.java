package com.example.training.task.dto;

import com.example.training.task.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * タスクの作成・更新リクエスト。
 * バリデーションはこのDTOにBean Validationで記述する。
 * priority は未指定(null)の場合「中」として扱う。
 * dueDate は任意(null = 期限なし)。更新時に null を送ると期限を解除する。
 * 期限切れのタスクも編集できるよう、過去日も受け付ける。
 * categoryId は任意(null = カテゴリなし)。更新時に null を送るとカテゴリを解除する。
 */
public record TaskRequest(
        @NotBlank(message = "タイトルは必須です")
        @Size(max = 100, message = "タイトルは100文字以内で入力してください")
        String title,

        @Size(max = 500, message = "説明は500文字以内で入力してください")
        String description,

        boolean done,

        Priority priority,

        LocalDate dueDate,

        Long categoryId
) {

    /** 未指定の場合は「中」を返す。 */
    public Priority priorityOrDefault() {
        return priority != null ? priority : Priority.MEDIUM;
    }
}
