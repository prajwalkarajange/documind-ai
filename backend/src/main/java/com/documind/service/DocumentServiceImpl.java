package com.documind.service;

import com.documind.dto.AuthDto;
import com.documind.dto.DocumentDto;
import com.documind.entity.Document;
import com.documind.entity.DocumentStatus;
import com.documind.entity.Profile;
import com.documind.repository.DocumentChunkRepository;
import com.documind.repository.DocumentRepository;
import com.documind.repository.ProfileRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ProfileRepository profileRepository;
    private final SupabaseStorageService storageService;
    private final GeminiService geminiService;
    private final PdfService pdfService;
    private final AuthService authService;

    public DocumentServiceImpl(DocumentRepository documentRepository,
                               DocumentChunkRepository documentChunkRepository,
                               ProfileRepository profileRepository,
                               SupabaseStorageService storageService,
                               GeminiService geminiService,
                               PdfService pdfService,
                               AuthService authService) {
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.profileRepository = profileRepository;
        this.storageService = storageService;
        this.geminiService = geminiService;
        this.pdfService = pdfService;
        this.authService = authService;
    }

    @Override
    @Transactional
    public DocumentDto.DocumentResponse uploadDocument(MultipartFile file) {
        AuthDto.UserDto user = authService.getCurrentUser();
        Profile profile = profileRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported");
        }

        // Limit size to 20MB
        if (file.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 20MB");
        }

        String storagePath = user.getId().toString() + "/" + UUID.randomUUID() + "-" + originalFilename;

        try {
            byte[] fileBytes = file.getBytes();
            storageService.uploadFile(storagePath, fileBytes, "application/pdf");

            Document document = Document.builder()
                    .user(profile)
                    .fileName(originalFilename)
                    .storagePath(storagePath)
                    .fileSize(file.getSize())
                    .status(DocumentStatus.PROCESSING)
                    .processingProgress(10)
                    .build();

            Document saved = documentRepository.save(document);
            
            // Trigger processing in background asynchronously
            processDocumentAsync(saved.getId());

            return mapToResponse(saved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file: " + e.getMessage(), e);
        }
    }

    @Override
    @Async
    @Transactional
    public void processDocumentAsync(UUID documentId) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return;

        try {
            // Stage 1: Extraction
            updateStatus(doc, DocumentStatus.EXTRACTING, 20, null);
            byte[] pdfBytes = storageService.downloadFile(doc.getStoragePath());
            PdfService.ExtractionResult extraction = pdfService.extractPdf(pdfBytes);
            doc.setPageCount(extraction.getTotalPages());

            // Stage 2: Chunking
            updateStatus(doc, DocumentStatus.CHUNKING, 40, null);
            List<PdfService.Chunk> chunks = pdfService.chunkPages(extraction.getPages());
            if (chunks.isEmpty()) {
                updateStatus(doc, DocumentStatus.FAILED, 0, "No readable text found. Scanned PDFs are not supported yet.");
                return;
            }
            doc.setChunkCount(chunks.size());

            // Stage 3: Embeddings
            updateStatus(doc, DocumentStatus.EMBEDDING, 60, null);
            List<String> texts = chunks.stream().map(PdfService.Chunk::getContent).collect(Collectors.toList());
            List<List<Double>> embeddings = geminiService.generateEmbeddings(texts);
            if (embeddings.size() != chunks.size()) {
                throw new RuntimeException("Generated embedding count mismatch.");
            }

            // Stage 4: Indexing in Vector Store
            updateStatus(doc, DocumentStatus.INDEXING, 80, null);
            documentChunkRepository.deleteByDocumentId(doc.getId());

            for (int i = 0; i < chunks.size(); i++) {
                PdfService.Chunk chunk = chunks.get(i);
                List<Double> embedding = embeddings.get(i);
                
                // Format embedding values list to postgres pgvector format string: [val1,val2,...]
                String vectorStr = embedding.stream()
                        .map(Object::toString)
                        .collect(Collectors.joining(",", "[", "]"));

                documentChunkRepository.insertChunk(
                        UUID.randomUUID(),
                        doc.getId(),
                        doc.getUser().getId(),
                        i,
                        chunk.getPageNumber(),
                        chunk.getContent(),
                        vectorStr
                );
            }

            // Complete Ingestion
            updateStatus(doc, DocumentStatus.COMPLETED, 100, null);

        } catch (Exception e) {
            System.err.println("Ingestion pipeline failed for document: " + doc.getId() + ", error: " + e.getMessage());
            updateStatus(doc, DocumentStatus.FAILED, 0, e.getMessage());
        }
    }

    private void updateStatus(Document doc, DocumentStatus status, int progress, String errorMessage) {
        doc.setStatus(status);
        doc.setProcessingProgress(progress);
        doc.setErrorMessage(errorMessage);
        doc.setUpdatedAt(Instant.now());
        documentRepository.save(doc);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> listDocuments() {
        AuthDto.UserDto user = authService.getCurrentUser();
        List<Document> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return docs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.DocumentResponse getDocument(UUID id) {
        AuthDto.UserDto user = authService.getCurrentUser();
        Document doc = documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        return mapToResponse(doc);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.DocumentStatusResponse getDocumentStatus(UUID id) {
        AuthDto.UserDto user = authService.getCurrentUser();
        Document doc = documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        return DocumentDto.DocumentStatusResponse.builder()
                .id(doc.getId())
                .status(doc.getStatus().name())
                .processingProgress(doc.getProcessingProgress())
                .chunkCount(doc.getChunkCount())
                .pageCount(doc.getPageCount())
                .errorMessage(doc.getErrorMessage())
                .build();
    }

    @Override
    @Transactional
    public void deleteDocument(UUID id) {
        AuthDto.UserDto user = authService.getCurrentUser();
        Document doc = documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Delete from Storage first
        storageService.deleteFile(doc.getStoragePath());

        // cascade delete of chunks, chat sessions/messages is done by database constraints
        documentRepository.delete(doc);
    }

    private DocumentDto.DocumentResponse mapToResponse(Document doc) {
        return DocumentDto.DocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .storagePath(doc.getStoragePath())
                .fileSize(doc.getFileSize())
                .pageCount(doc.getPageCount())
                .chunkCount(doc.getChunkCount())
                .status(doc.getStatus().name())
                .processingProgress(doc.getProcessingProgress())
                .errorMessage(doc.getErrorMessage())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .ownerName(doc.getUser().getName())
                .ownerEmail(doc.getUser().getEmail())
                .build();
    }
}
