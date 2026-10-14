package com.example.training.task;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    /** 一覧でカテゴリを1件ずつ読み込まない(N+1にしない)よう、カテゴリも同時に取得する。 */
    @EntityGraph(attributePaths = "category")
    List<Task> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = "category")
    List<Task> findAllByCategoryIdOrderByIdAsc(Long categoryId);

    /** 指定カテゴリのタスクをカテゴリなしに戻す(カテゴリ削除時に使用)。 */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Task t SET t.category = null WHERE t.category.id = :categoryId")
    int clearCategory(@Param("categoryId") Long categoryId);
}
