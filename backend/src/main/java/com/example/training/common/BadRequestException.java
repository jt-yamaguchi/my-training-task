package com.example.training.common;

/**
 * リクエストの値が業務ルール上受け付けられない場合にServiceレイヤーから送出する例外。
 * (例: 存在しないカテゴリIDをタスクに指定した)
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
