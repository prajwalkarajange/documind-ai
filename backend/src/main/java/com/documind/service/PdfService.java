package com.documind.service;

import lombok.Builder;
import lombok.Value;

import java.util.List;

public interface PdfService {
    
    @Value
    @Builder
    class Chunk {
        String content;
        int pageNumber;
    }
    
    @Value
    @Builder
    class ExtractionResult {
        int totalPages;
        List<String> pages;
    }

    ExtractionResult extractPdf(byte[] pdfBytes);
    List<Chunk> chunkPages(List<String> pages);
}
