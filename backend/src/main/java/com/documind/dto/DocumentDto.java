package com.documind.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

public class DocumentDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentResponse {
        private UUID id;
        private String fileName;
        private String storagePath;
        private long fileSize;
        private Integer pageCount;
        private Integer chunkCount;
        private String status; // 'UPLOADING', 'EXTRACTING', etc.
        private int processingProgress;
        private String errorMessage;
        private Instant createdAt;
        private Instant updatedAt;
        private String ownerName;
        private String ownerEmail;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentStatusResponse {
        private UUID id;
        private String status;
        private int processingProgress;
        private Integer chunkCount;
        private Integer pageCount;
        private String errorMessage;
    }
}
