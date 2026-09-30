package com.example.training.category.dto;

import com.example.training.category.Category;

/**
 * カテゴリのレスポンス。エンティティからの変換はfromメソッドに集約する。
 */
public record CategoryResponse(
        Long id,
        String name
) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }
}
