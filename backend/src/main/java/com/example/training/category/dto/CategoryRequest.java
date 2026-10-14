package com.example.training.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * カテゴリの追加リクエスト。
 * name は前後の空白を除いた値で登録・重複判定する(Serviceで除去)。
 */
public record CategoryRequest(
        @NotBlank(message = "カテゴリ名は必須です")
        @Size(max = 30, message = "カテゴリ名は30文字以内で入力してください")
        String name
) {
}
