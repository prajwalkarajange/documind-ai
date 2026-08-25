package com.documind.service;

import java.util.List;

public interface GeminiService {
    List<Double> generateEmbedding(String text);
    List<List<Double>> generateEmbeddings(List<String> texts);
    String generateAnswer(String question, String contextText, String fileName);
}
