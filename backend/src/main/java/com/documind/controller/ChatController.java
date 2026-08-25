package com.documind.controller;

import com.documind.dto.ChatDto;
import com.documind.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatDto.ChatResponse> askQuestion(@Validated @RequestBody ChatDto.ChatRequest request) {
        return ResponseEntity.ok(chatService.askQuestion(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatDto.ChatSessionSummary>> getSessionHistory() {
        return ResponseEntity.ok(chatService.getSessionHistory());
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatDto.ChatSessionDetail> getSessionDetails(@PathVariable("sessionId") UUID sessionId) {
        return ResponseEntity.ok(chatService.getSessionDetails(sessionId));
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable("sessionId") UUID sessionId) {
        chatService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }
}
