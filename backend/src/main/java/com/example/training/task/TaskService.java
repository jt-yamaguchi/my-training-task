package com.example.training.task;

import com.example.training.common.NotFoundException;
import com.example.training.task.dto.TaskRequest;
import com.example.training.task.dto.TaskResponse;
import com.example.training.task.dto.TaskSort;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * タスクのビジネスロジック。トランザクション境界はこのレイヤーに置く。
 */
@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final Clock clock;

    public TaskService(TaskRepository taskRepository, Clock clock) {
        this.taskRepository = taskRepository;
        this.clock = clock;
    }

    /**
     * タスク一覧を取得する。
     * 優先度順はID昇順の一覧を安定ソートするため、同じ優先度の中ではID昇順になる。
     */
    public List<TaskResponse> findAll(TaskSort sort) {
        List<Task> tasks = taskRepository.findAllByOrderByIdAsc();
        if (sort == TaskSort.PRIORITY) {
            tasks = tasks.stream()
                    .sorted(Comparator.comparing(Task::getPriority))
                    .toList();
        }
        LocalDate today = LocalDate.now(clock);
        return tasks.stream()
                .map(task -> toResponse(task, today))
                .toList();
    }

    public TaskResponse findById(Long id) {
        return toResponse(getTask(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = new Task(request.title(), request.description(), request.priorityOrDefault(),
                request.dueDate());
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTask(id);
        task.update(request.title(), request.description(), request.done(), request.priorityOrDefault(),
                request.dueDate(), OffsetDateTime.now(clock));
        return toResponse(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = getTask(id);
        taskRepository.delete(task);
    }

    /**
     * 期限切れかどうかを判定する。
     * 期限が今日より前で、かつ未完了のものを期限切れとする(期限が今日なら期限切れではない。期限なしは対象外)。
     */
    private static boolean isOverdue(Task task, LocalDate today) {
        return task.getDueDate() != null && task.getDueDate().isBefore(today) && !task.isDone();
    }

    private TaskResponse toResponse(Task task) {
        return toResponse(task, LocalDate.now(clock));
    }

    private TaskResponse toResponse(Task task, LocalDate today) {
        return TaskResponse.from(task, isOverdue(task, today));
    }

    private Task getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("タスクが見つかりません: id=" + id));
    }
}
