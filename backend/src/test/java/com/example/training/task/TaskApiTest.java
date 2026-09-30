package com.example.training.task;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * タスクAPIの結合テスト。H2(PostgreSQL互換モード)+ Flyway で実行される。
 * 新しいAPIを追加するときはこのテストの書き方を模倣すること。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TaskApiTest {

    /** テスト中の「今日」。期限切れ判定の結果がテスト実行日に左右されないよう固定する。 */
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 15);

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock fixedClock() {
            ZoneId zone = ZoneId.of("Asia/Tokyo");
            return Clock.fixed(TODAY.atStartOfDay(zone).toInstant(), zone);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void タスク一覧を取得できる() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("環境構築を完了する"));
    }

    @Test
    void タスクを作成できる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"新しいタスク\", \"description\": \"説明\", \"done\": false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("新しいタスク"))
                .andExpect(jsonPath("$.done").value(false));
    }

    @Test
    void タイトルが空だと400になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"\", \"description\": null, \"done\": false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void タスクを更新できる() throws Exception {
        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"更新後\", \"description\": null, \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("更新後"))
                .andExpect(jsonPath("$.done").value(true));
    }

    @Test
    void 存在しないタスクは404になる() throws Exception {
        mockMvc.perform(get("/api/tasks/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 優先度を指定して作成すると取得でも同じ値になる() throws Exception {
        String body = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"急ぎのタスク\", \"description\": null, \"done\": false, "
                                + "\"priority\": \"HIGH\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(body, "$.id");

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("HIGH"));
    }

    @Test
    void 優先度を指定しないと中になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"新しいタスク\", \"description\": null, \"done\": false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.priority").value("MEDIUM"));
    }

    @Test
    void 優先度が不正な値だと400になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"新しいタスク\", \"description\": null, \"done\": false, "
                                + "\"priority\": \"URGENT\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 既存タスクの優先度は中になっている() throws Exception {
        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("MEDIUM"));
    }

    @Test
    void 優先度を更新できる() throws Exception {
        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"更新後\", \"description\": null, \"done\": false, "
                                + "\"priority\": \"LOW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("LOW"));
    }

    @Test
    void 優先度順で一覧を取得できる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"低いタスク\", \"description\": null, \"done\": false, "
                                + "\"priority\": \"LOW\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"高いタスク\", \"description\": null, \"done\": false, "
                                + "\"priority\": \"HIGH\"}"))
                .andExpect(status().isCreated());

        // 高 → 中(初期データ3件、ID昇順) → 低 の順になる
        mockMvc.perform(get("/api/tasks").param("sort", "PRIORITY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("高いタスク"))
                .andExpect(jsonPath("$[1].title").value("環境構築を完了する"))
                .andExpect(jsonPath("$[3].title").value("最初の機能を追加する"))
                .andExpect(jsonPath("$[4].title").value("低いタスク"));
    }

    @Test
    void 並び順が不正な値だと400になる() throws Exception {
        mockMvc.perform(get("/api/tasks").param("sort", "UNKNOWN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 期限を指定して作成すると取得でも同じ日付になる() throws Exception {
        String body = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"期限付きタスク\", \"description\": null, \"done\": false, "
                                + "\"dueDate\": \"2026-10-31\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2026-10-31"))
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(body, "$.id");

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2026-10-31"));
    }

    @Test
    void 期限なしでも作成できる() throws Exception {
        String body = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"期限なしタスク\", \"description\": null, \"done\": false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value(nullValue()))
                .andExpect(jsonPath("$.overdue").value(false))
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(body, "$.id");

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value(nullValue()));
    }

    @Test
    void 期限をnullで更新すると期限が解除される() throws Exception {
        mockMvc.perform(put("/api/tasks/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"更新後\", \"description\": null, \"done\": false, "
                                + "\"dueDate\": \"2026-10-31\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2026-10-31"));

        mockMvc.perform(put("/api/tasks/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"更新後\", \"description\": null, \"done\": false, "
                                + "\"dueDate\": null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value(nullValue()));
    }

    @Test
    void 期限の形式が不正だと400になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"新しいタスク\", \"description\": null, \"done\": false, "
                                + "\"dueDate\": \"2026/10/31\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 期限が今日より前の未完了タスクは期限切れになる() throws Exception {
        assertOverdue("2026-10-14", false, true);
    }

    @Test
    void 期限が今日のタスクは期限切れにならない() throws Exception {
        assertOverdue("2026-10-15", false, false);
    }

    @Test
    void 期限が今日より後のタスクは期限切れにならない() throws Exception {
        assertOverdue("2026-10-16", false, false);
    }

    @Test
    void 期限が過ぎていても完了済みなら期限切れにならない() throws Exception {
        assertOverdue("2026-10-14", true, false);
    }

    /** ID=2 のタスクを指定の期限・完了状態に更新し、一覧での overdue を検証する。 */
    private void assertOverdue(String dueDate, boolean done, boolean expected) throws Exception {
        mockMvc.perform(put("/api/tasks/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"期限切れ判定\", \"description\": null, \"done\": " + done
                                + ", \"dueDate\": \"" + dueDate + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overdue").value(expected));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].overdue").value(expected));
    }

    @Test
    void タスクを削除できる() throws Exception {
        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isNotFound());
    }
}
