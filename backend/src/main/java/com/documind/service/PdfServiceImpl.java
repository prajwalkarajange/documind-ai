package com.documind.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfServiceImpl implements PdfService {

    @Override
    public ExtractionResult extractPdf(byte[] pdfBytes) {
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            int totalPages = document.getNumberOfPages();
            List<String> pages = new ArrayList<>();
            PDFTextStripper stripper = new PDFTextStripper();
            
            for (int i = 1; i <= totalPages; i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String pageText = stripper.getText(document);
                // Replace extra whitespaces with a single space
                pageText = pageText.replaceAll("\\s+", " ").trim();
                pages.add(pageText);
            }
            
            return ExtractionResult.builder()
                    .totalPages(totalPages)
                    .pages(pages)
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Failed to extract text from PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Chunk> chunkPages(List<String> pages) {
        List<Chunk> chunks = new ArrayList<>();
        int chunkSize = 1200;
        int chunkOverlap = 150;
        
        for (int index = 0; index < pages.size(); index++) {
            String text = pages.get(index);
            if (text == null || text.isBlank()) continue;
            
            int cursor = 0;
            int pageNumber = index + 1;
            
            while (cursor < text.length()) {
                int end = Math.min(text.length(), cursor + chunkSize);
                if (end < text.length()) {
                    int boundary = text.lastIndexOf(". ", end);
                    // If a sentence end boundary is found within the last 50% of the chunk size, split there
                    if (boundary > cursor + chunkSize * 0.5) {
                        end = boundary + 1; // Include the period in the current chunk
                    }
                }
                
                String content = text.substring(cursor, end).trim();
                if (content.length() > 30) {
                    chunks.add(Chunk.builder()
                            .content(content)
                            .pageNumber(pageNumber)
                            .build());
                }
                
                if (end >= text.length()) {
                    break;
                }
                
                cursor = Math.max(end - chunkOverlap, cursor + 1);
            }
        }
        
        return chunks;
    }
}
