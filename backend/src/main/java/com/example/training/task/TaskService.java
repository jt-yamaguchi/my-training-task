package com.example.training.task;

import com.example.training.common.NotFoundException;
import com.example.training.task.dto.TaskRequest;
import com.example.training.task.dto.TaskResponse;
import com.example.training.task.dto.TaskSort;
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

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
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
        return tasks.stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse findById(Long id) {
        return TaskResponse.from(getTask(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = new Task(request.title(), request.description(), request.priorityOrDefault());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTask(id);
        task.update(request.title(), request.description(), request.done(), request.priorityOrDefault());
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = getTask(id);
        taskRepository.delete(task);
    }

    private Task getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("タスクが見つかりません: id=" + id));
    }
}
