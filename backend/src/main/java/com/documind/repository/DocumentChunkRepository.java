package com.documind.repository;

import com.documind.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    
    @Transactional
    void deleteByDocumentId(UUID documentId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO document_chunks (id, document_id, user_id, chunk_index, page_number, content, embedding) " +
                   "VALUES (:id, :documentId, :userId, :chunkIndex, :pageNumber, :content, cast(:embedding as vector))", 
           nativeQuery = true)
    void insertChunk(
        @Param("id") UUID id,
        @Param("documentId") UUID documentId,
        @Param("userId") UUID userId,
        @Param("chunkIndex") int chunkIndex,
        @Param("pageNumber") Integer pageNumber,
        @Param("content") String content,
        @Param("embedding") String embedding
    );

    @Query(value = "SELECT id, content, page_number, similarity FROM match_document_chunks(:documentId, cast(:queryEmbedding as vector), :matchCount)", 
           nativeQuery = true)
    List<Object[]> matchDocumentChunks(
        @Param("documentId") UUID documentId,
        @Param("queryEmbedding") String queryEmbedding,
        @Param("matchCount") int matchCount
    );
}
