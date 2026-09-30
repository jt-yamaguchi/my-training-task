package com.example.training.task.dto;

/**
 * タスク一覧の並び順(GET /api/tasks の sort パラメータ)。
 */
public enum TaskSort {
    /** 登録順(ID昇順) */
    ID,
    /** 優先度順(高 → 中 → 低、同じ優先度はID昇順) */
    PRIORITY
}
