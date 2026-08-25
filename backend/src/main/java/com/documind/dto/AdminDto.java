package com.documind.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AdminDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimeSeriesPoint {
        private String date;
        private long count;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminStats {
        private long totalUsers;
        private long totalDocuments;
        private long totalQuestions;
        private long processedDocuments;
        private long processingDocuments;
        private long failedDocuments;
        private List<TimeSeriesPoint> newUsersOverTime;
        private List<TimeSeriesPoint> documentsOverTime;
        private List<TimeSeriesPoint> questionsOverTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminUser {
        private UUID id;
        private String name;
        private String email;
        private String role;
        private boolean enabled;
        private long documentCount;
        private Instant createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProcessingJob {
        private UUID id;
        private UUID documentId;
        private String documentName;
        private String ownerEmail;
        private String ownerName;
        private String status;
        private String stage;
        private Integer progress;
        private Instant startedAt;
        private Instant completedAt;
        private String errorMessage;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SystemHealth {
        private String backend; // 'UP', 'DOWN', etc.
        private String database;
        private String vectorStore;
        private String aiService;
        private String storage;
        private Map<String, String> details;
    }
}
