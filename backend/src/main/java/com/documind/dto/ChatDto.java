package com.documind.dto;

import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ChatDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRequest {
        @NotNull(message = "Document ID is required")
        private UUID documentId;

        @NotBlank(message = "Question/Message is required")
        private String question;

        private UUID sessionId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatSource {
        private String fileName;
        private Integer pageNumber;
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private String answer;
        private List<ChatSource> sources;
        private UUID sessionId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatSessionSummary {
        private UUID id;
        private UUID documentId;
        private String documentName;
        private String title;
        private int messageCount;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessageResponse {
        private UUID id;
        private String role; // 'USER' or 'ASSISTANT'
        private String content;
        private List<ChatSource> sources;
        private Instant createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatSessionDetail {
        private UUID id;
        private UUID documentId;
        private String documentName;
        private String title;
        private int messageCount;
        private Instant createdAt;
        private Instant updatedAt;
        private List<ChatMessageResponse> messages;
    }
}
