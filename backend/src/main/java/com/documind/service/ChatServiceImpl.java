package com.documind.service;

import com.documind.dto.AuthDto;
import com.documind.dto.ChatDto;
import com.documind.entity.ChatMessage;
import com.documind.entity.ChatSession;
import com.documind.entity.Document;
import com.documind.entity.DocumentStatus;
import com.documind.entity.Profile;
import com.documind.repository.ChatMessageRepository;
import com.documind.repository.ChatSessionRepository;
import com.documind.repository.DocumentChunkRepository;
import com.documind.repository.DocumentRepository;
import com.documind.repository.ProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ProfileRepository profileRepository;
    private final GeminiService geminiService;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public ChatServiceImpl(ChatSessionRepository chatSessionRepository,
                           ChatMessageRepository chatMessageRepository,
                           DocumentRepository documentRepository,
                           DocumentChunkRepository documentChunkRepository,
                           ProfileRepository profileRepository,
                           GeminiService geminiService,
                           AuthService authService,
                           ObjectMapper objectMapper) {
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.profileRepository = profileRepository;
        this.geminiService = geminiService;
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ChatDto.ChatResponse askQuestion(ChatDto.ChatRequest request) {
        AuthDto.UserDto user = authService.getCurrentUser();
        Profile profile = profileRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        Document doc = documentRepository.findByIdAndUserId(request.getDocumentId(), user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (doc.getStatus() != DocumentStatus.COMPLETED) {
            throw new IllegalStateException("This document is still being processed and cannot be queried yet.");
        }

        // 1. Generate query embedding for user question
        List<Double> queryEmbedding = geminiService.generateEmbedding(request.getQuestion());

        // Format vector double values to pgvector cast format string: [v1,v2,...]
        String queryVectorStr = queryEmbedding.stream()
                .map(Object::toString)
                .collect(Collectors.joining(",", "[", "]"));

        // 2. Perform similarity search in database chunks via custom SQL match function
        List<Object[]> matches = documentChunkRepository.matchDocumentChunks(doc.getId(), queryVectorStr, 5);

        List<ChatDto.ChatSource> sources = new ArrayList<>();
        StringBuilder contextBuilder = new StringBuilder();
        
        int counter = 1;
        for (Object[] match : matches) {
            // Index map: 0 = id, 1 = content, 2 = pageNumber, 3 = similarity
            String content = (String) match[1];
            Integer pageNumber = (Integer) match[2];

            contextBuilder.append("[").append(counter++).append("] (page ")
                    .append(pageNumber != null ? pageNumber : "?").append(")\n")
                    .append(content).append("\n\n");

            sources.add(ChatDto.ChatSource.builder()
                    .fileName(doc.getFileName())
                    .pageNumber(pageNumber)
                    .content(content.length() > 400 ? content.substring(0, 400) : content)
                    .build());
        }

        // 3. Generate answer via Gemini with context
        String answer;
        if (sources.isEmpty()) {
            answer = "I couldn't find enough information about this in the uploaded document.";
        } else {
            answer = geminiService.generateAnswer(request.getQuestion(), contextBuilder.toString(), doc.getFileName());
        }

        // 4. Retrieve or create chat session
        ChatSession session = null;
        if (request.getSessionId() != null) {
            session = chatSessionRepository.findByIdAndUserId(request.getSessionId(), user.getId()).orElse(null);
        }

        if (session == null) {
            String title = request.getQuestion().trim();
            if (title.length() > 120) {
                title = title.substring(0, 117) + "...";
            }
            session = ChatSession.builder()
                    .user(profile)
                    .document(doc)
                    .title(title)
                    .build();
            session = chatSessionRepository.save(session);
        } else {
            session.setUpdatedAt(Instant.now());
            session = chatSessionRepository.save(session);
        }

        // 5. Save USER & ASSISTANT messages to chat log
        try {
            String sourcesJson = objectMapper.writeValueAsString(sources);
            
            ChatMessage userMsg = ChatMessage.builder()
                    .session(session)
                    .user(profile)
                    .role("USER")
                    .content(request.getQuestion())
                    .sources("[]")
                    .build();
            
            ChatMessage assistantMsg = ChatMessage.builder()
                    .session(session)
                    .user(profile)
                    .role("ASSISTANT")
                    .content(answer)
                    .sources(sourcesJson)
                    .build();

            chatMessageRepository.save(userMsg);
            chatMessageRepository.save(assistantMsg);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save chat message history: " + e.getMessage(), e);
        }

        return ChatDto.ChatResponse.builder()
                .answer(answer)
                .sources(sources)
                .sessionId(session.getId())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatDto.ChatSessionSummary> getSessionHistory() {
        AuthDto.UserDto user = authService.getCurrentUser();
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());
        
        return sessions.stream().map(session -> {
            // Count messages (user + assistant) in session
            List<ChatMessage> msgs = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId());
            return ChatDto.ChatSessionSummary.builder()
                    .id(session.getId())
                    .documentId(session.getDocument().getId())
                    .documentName(session.getDocument().getFileName())
                    .title(session.getTitle())
                    .messageCount(msgs.size())
                    .createdAt(session.getCreatedAt())
                    .updatedAt(session.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ChatDto.ChatSessionDetail getSessionDetails(UUID sessionId) {
        AuthDto.UserDto user = authService.getCurrentUser();
        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found"));

        List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        
        List<ChatDto.ChatMessageResponse> messageDtos = messages.stream().map(msg -> {
            List<ChatDto.ChatSource> sources = new ArrayList<>();
            if (msg.getSources() != null && !msg.getSources().isBlank()) {
                try {
                    sources = objectMapper.readValue(msg.getSources(), 
                            new com.fasterxml.jackson.core.type.TypeReference<List<ChatDto.ChatSource>>() {});
                } catch (Exception e) {
                    System.err.println("Warning: failed to parse chat sources JSON: " + e.getMessage());
                }
            }
            return ChatDto.ChatMessageResponse.builder()
                    .id(msg.getId())
                    .role(msg.getRole())
                    .content(msg.getContent())
                    .sources(sources)
                    .createdAt(msg.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return ChatDto.ChatSessionDetail.builder()
                .id(session.getId())
                .documentId(session.getDocument().getId())
                .documentName(session.getDocument().getFileName())
                .title(session.getTitle())
                .messageCount(messages.size())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .messages(messageDtos)
                .build();
    }

    @Override
    @Transactional
    public void deleteSession(UUID sessionId) {
        AuthDto.UserDto user = authService.getCurrentUser();
        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found"));

        // cascade delete of messages is configured by hibernate annotation/database constraint
        chatSessionRepository.delete(session);
    }
}
