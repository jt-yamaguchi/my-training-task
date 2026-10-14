package com.example.training.category;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * カテゴリAPIの結合テスト。H2(PostgreSQL互換モード)+ Flyway で実行される。
 * 初期データ(V7)のカテゴリは ID=1 仕事 / ID=2 私用 / ID=3 勉強。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CategoryApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void カテゴリ一覧を登録順で取得できる() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("仕事"))
                .andExpect(jsonPath("$[1].name").value("私用"))
                .andExpect(jsonPath("$[2].name").value("勉強"));
    }

    @Test
    void カテゴリを追加できる() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"趣味\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("趣味"));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[3].name").value("趣味"));
    }

    @Test
    void カテゴリ名の前後の空白は除いて登録される() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"  趣味  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("趣味"));
    }

    @Test
    void カテゴリ名が空だと400になる() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void カテゴリ名は30文字まで登録できる() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + "あ".repeat(30) + "\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void カテゴリ名が31文字だと400になる() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + "あ".repeat(31) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 同じ名前のカテゴリは追加できず409になる() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"仕事\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 前後の空白を除くと同じ名前になるカテゴリは409になる() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \" 仕事 \"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void カテゴリを削除できる() throws Exception {
        mockMvc.perform(delete("/api/categories/3"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void 存在しないカテゴリの削除は404になる() throws Exception {
        mockMvc.perform(delete("/api/categories/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 使用中のカテゴリを削除するとタスクはカテゴリなしになる() throws Exception {
        Integer workTaskId = createTaskWithCategory("仕事のタスク", 1);
        Integer privateTaskId = createTaskWithCategory("私用のタスク", 2);

        // 使用中でも削除はエラーにならない
        mockMvc.perform(delete("/api/categories/1"))
                .andExpect(status().isNoContent());

        // 削除したカテゴリのタスクはカテゴリなしに戻り、タスク自体は残る
        mockMvc.perform(get("/api/tasks/" + workTaskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("仕事のタスク"))
                .andExpect(jsonPath("$.category").value(nullValue()));
        // 別カテゴリのタスクは変わらない
        mockMvc.perform(get("/api/tasks/" + privateTaskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category.id").value(2));
    }

    /** 指定カテゴリのタスクを作成し、そのIDを返す。 */
    private Integer createTaskWithCategory(String title, int categoryId) throws Exception {
        String body = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"" + title + "\", \"description\": null, \"done\": false, "
                                + "\"categoryId\": " + categoryId + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.id").value(categoryId))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }
}
