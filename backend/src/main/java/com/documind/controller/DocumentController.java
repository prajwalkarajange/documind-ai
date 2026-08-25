package com.documind.controller;

import com.documind.dto.DocumentDto;
import com.documind.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentDto.DocumentResponse> uploadDocument(@RequestParam("file") MultipartFile file) {
        return new ResponseEntity<>(documentService.uploadDocument(file), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DocumentDto.DocumentResponse>> listDocuments() {
        return ResponseEntity.ok(documentService.listDocuments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDto.DocumentResponse> getDocument(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<DocumentDto.DocumentStatusResponse> getDocumentStatus(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(documentService.getDocumentStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable("id") UUID id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
