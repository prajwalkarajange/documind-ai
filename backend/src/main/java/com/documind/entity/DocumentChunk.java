package com.documind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Profile user;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // We keep embedding as a String mapping to pgvector, and insert/update it via native SQL.
    @Column(columnDefinition = "vector(768)")
    private String embedding;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
