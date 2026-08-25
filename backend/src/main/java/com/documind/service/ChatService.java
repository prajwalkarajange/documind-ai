package com.documind.service;

import com.documind.dto.ChatDto;

import java.util.List;
import java.util.UUID;

public interface ChatService {
    ChatDto.ChatResponse askQuestion(ChatDto.ChatRequest request);
    List<ChatDto.ChatSessionSummary> getSessionHistory();
    ChatDto.ChatSessionDetail getSessionDetails(UUID sessionId);
    void deleteSession(UUID sessionId);
}
