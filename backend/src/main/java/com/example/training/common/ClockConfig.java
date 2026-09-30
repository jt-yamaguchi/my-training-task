package com.example.training.common;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 「今日」の基準となる時計。
 * 期限切れ判定などで現在日時を使う箇所はこの Clock をDIして使う(テストで日付を固定できるようにするため)。
 * タイムゾーンはサーバーの既定(環境変数 TZ。docker-compose では Asia/Tokyo)に従う。
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
