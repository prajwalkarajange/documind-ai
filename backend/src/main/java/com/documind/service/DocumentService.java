package com.documind.service;

import com.documind.dto.DocumentDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface DocumentService {
    DocumentDto.DocumentResponse uploadDocument(MultipartFile file);
    List<DocumentDto.DocumentResponse> listDocuments();
    DocumentDto.DocumentResponse getDocument(UUID id);
    DocumentDto.DocumentStatusResponse getDocumentStatus(UUID id);
    void deleteDocument(UUID id);
    void processDocumentAsync(UUID id);
}
