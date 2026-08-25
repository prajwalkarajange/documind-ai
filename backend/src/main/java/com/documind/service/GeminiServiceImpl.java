package com.documind.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiServiceImpl implements GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key}")
    private String apiKey;

    public GeminiServiceImpl(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<Double> generateEmbedding(String text) {
        List<List<Double>> embeddings = generateEmbeddings(List.of(text));
        if (embeddings == null || embeddings.isEmpty()) {
            throw new RuntimeException("Failed to generate embedding: empty response");
        }
        return embeddings.get(0);
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<List<Double>> generateEmbeddings(List<String> texts) {
        List<List<Double>> allEmbeddings = new ArrayList<>();
        int batchSize = 32;

        for (int i = 0; i < texts.size(); i += batchSize) {
            List<String> subList = texts.subList(i, Math.min(i + batchSize, texts.size()));
            
            try {
                Map<String, Object> requestBody = new HashMap<>();
                List<Map<String, Object>> requests = new ArrayList<>();

                for (String text : subList) {
                    Map<String, Object> embedRequest = new HashMap<>();
                    embedRequest.put("model", "models/gemini-embedding-001");
                    embedRequest.put("outputDimensionality", 768);
                    
                    Map<String, Object> content = new HashMap<>();
                    content.put("parts", List.of(Map.of("text", text)));
                    
                    embedRequest.put("content", content);
                    requests.add(embedRequest);
                }
                
                requestBody.put("requests", requests);

                String responseJson = webClient.post()
                        .uri("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=" + apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                Map<String, Object> responseMap = objectMapper.readValue(responseJson, Map.class);
                List<Map<String, Object>> embeddingsList = (List<Map<String, Object>>) responseMap.get("embeddings");
                
                if (embeddingsList != null) {
                    for (Map<String, Object> embMap : embeddingsList) {
                        List<Double> values = (List<Double>) embMap.get("values");
                        allEmbeddings.add(values);
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException("Gemini Embeddings generation failed: " + e.getMessage(), e);
            }
        }

        return allEmbeddings;
    }

    @SuppressWarnings("unchecked")
    @Override
    public String generateAnswer(String question, String contextText, String fileName) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            
            // User Content
            Map<String, Object> userPart = new HashMap<>();
            userPart.put("text", "Document: " + fileName + "\n\nContext excerpts:\n" + contextText + "\n\nQuestion: " + question);
            
            Map<String, Object> userContent = new HashMap<>();
            userContent.put("role", "user");
            userContent.put("parts", List.of(userPart));
            
            requestBody.put("contents", List.of(userContent));

            // System Instruction
            Map<String, Object> systemPart = new HashMap<>();
            systemPart.put("text", "You are a document question-answering assistant. " +
                    "Answer ONLY using the provided document context. Do not use outside knowledge. " +
                    "Do not invent facts. Do not invent citations. If the answer cannot be found in the " +
                    "provided context, say exactly: \"I couldn't find enough information about this in the uploaded document.\" " +
                    "Cite the page numbers you used inline like (page 4). Use concise markdown.");
            
            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(systemPart));
            
            requestBody.put("systemInstruction", systemInstruction);

            String uriStr = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + apiKey;
            System.out.println("DEBUG: WebClient Requesting URI -> " + (apiKey != null ? uriStr.substring(0, uriStr.length() - Math.min(10, apiKey.length())) + "...[masked]" : "null key"));
            
            String responseJson = webClient.post()
                    .uri(uriStr)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            Map<String, Object> responseMap = objectMapper.readValue(responseJson, Map.class);
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> firstCandidate = candidates.get(0);
                Map<String, Object> contentMap = (Map<String, Object>) firstCandidate.get("content");
                if (contentMap != null) {
                    List<Map<String, Object>> partsList = (List<Map<String, Object>>) contentMap.get("parts");
                    if (partsList != null && !partsList.isEmpty()) {
                        return (String) partsList.get(0).get("text");
                    }
                }
            }
            
            return "I couldn't find enough information about this in the uploaded document.";
        } catch (Exception e) {
            throw new RuntimeException("Gemini Content generation failed: " + e.getMessage(), e);
        }
    }
}
