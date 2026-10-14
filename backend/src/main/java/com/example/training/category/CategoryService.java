package com.example.training.category;

import com.example.training.category.dto.CategoryRequest;
import com.example.training.category.dto.CategoryResponse;
import com.example.training.common.ConflictException;
import com.example.training.common.NotFoundException;
import com.example.training.task.TaskRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * カテゴリのビジネスロジック。トランザクション境界はこのレイヤーに置く。
 */
@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TaskRepository taskRepository;

    public CategoryService(CategoryRepository categoryRepository, TaskRepository taskRepository) {
        this.categoryRepository = categoryRepository;
        this.taskRepository = taskRepository;
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByIdAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    /**
     * カテゴリを追加する。名前は前後の空白を除いてから登録し、同じ名前が既にあれば409とする。
     */
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = request.name().strip();
        if (categoryRepository.existsByName(name)) {
            throw new ConflictException("同じ名前のカテゴリが既にあります: " + name);
        }
        return CategoryResponse.from(categoryRepository.save(new Category(name)));
    }

    /**
     * カテゴリを削除する。使用中のタスクはカテゴリなしに戻す(削除はエラーにしない)。
     * DBの外部キー(ON DELETE SET NULL)でも同じ結果になるが、同じトランザクション内で
     * 読み込み済みのタスクが古い参照を持ち続けないよう、先に明示的にカテゴリを外す。
     */
    @Transactional
    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("カテゴリが見つかりません: id=" + id);
        }
        taskRepository.clearCategory(id);
        categoryRepository.deleteById(id);
    }
}
