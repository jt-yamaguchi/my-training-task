package com.example.training.task;

/**
 * タスクの優先度。
 * 宣言順(高 → 中 → 低)を優先度順の並べ替えに使う。DBには名前(文字列)で保存する。
 */
public enum Priority {
    HIGH,
    MEDIUM,
    LOW
}
