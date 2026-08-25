package com.documind.service;

import com.documind.dto.AdminDto;
import com.documind.dto.DocumentDto;
import com.documind.entity.Document;
import com.documind.entity.DocumentStatus;
import com.documind.entity.Profile;
import com.documind.entity.UserRole;
import com.documind.repository.ChatMessageRepository;
import com.documind.repository.DocumentRepository;
import com.documind.repository.ProfileRepository;
import com.documind.repository.UserRoleRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final DocumentRepository documentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SupabaseStorageService storageService;
    private final GeminiService geminiService;
    private final DocumentService documentService;

    // Use @Lazy on DocumentService to avoid any potential bean initialization issues
    public AdminServiceImpl(ProfileRepository profileRepository,
                            UserRoleRepository userRoleRepository,
                            DocumentRepository documentRepository,
                            ChatMessageRepository chatMessageRepository,
                            SupabaseStorageService storageService,
                            GeminiService geminiService,
                            @Lazy DocumentService documentService) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.documentRepository = documentRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.storageService = storageService;
        this.geminiService = geminiService;
        this.documentService = documentService;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDto.AdminStats getStats() {
        long totalUsers = profileRepository.count();
        long totalDocuments = documentRepository.count();
        
        // count messages with role = 'USER' as questions
        long totalQuestions = chatMessageRepository.findAll().stream()
                .filter(msg -> msg.getRole().equalsIgnoreCase("USER"))
                .count();

        List<Document> allDocs = documentRepository.findAll();
        long processedDocs = allDocs.stream().filter(d -> d.getStatus() == DocumentStatus.COMPLETED).count();
        long failedDocs = allDocs.stream().filter(d -> d.getStatus() == DocumentStatus.FAILED).count();
        long processingDocs = allDocs.size() - processedDocs - failedDocs;

        return AdminDto.AdminStats.builder()
                .totalUsers(totalUsers)
                .totalDocuments(totalDocuments)
                .totalQuestions(totalQuestions)
                .processedDocuments(processedDocs)
                .processingDocuments(processingDocs)
                .failedDocuments(failedDocs)
                .newUsersOverTime(Collections.emptyList())
                .documentsOverTime(Collections.emptyList())
                .questionsOverTime(Collections.emptyList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminDto.AdminUser> getUsers() {
        List<Profile> profiles = profileRepository.findAll();
        List<UserRole> allRoles = userRoleRepository.findAll();
        List<Document> allDocs = documentRepository.findAll();

        Map<UUID, List<UserRole>> userRolesMap = allRoles.stream()
                .collect(Collectors.groupingBy(role -> role.getUser().getId()));
        
        Map<UUID, Long> documentCountsMap = allDocs.stream()
                .collect(Collectors.groupingBy(doc -> doc.getUser().getId(), Collectors.counting()));

        return profiles.stream().map(profile -> {
            List<UserRole> roles = userRolesMap.getOrDefault(profile.getId(), Collections.emptyList());
            String mainRole = roles.stream()
                    .map(UserRole::getRole)
                    .filter(role -> role.equalsIgnoreCase("ADMIN"))
                    .findFirst()
                    .orElse("USER");

            return AdminDto.AdminUser.builder()
                    .id(profile.getId())
                    .name(profile.getName())
                    .email(profile.getEmail())
                    .role(mainRole)
                    .enabled(profile.isEnabled())
                    .documentCount(documentCountsMap.getOrDefault(profile.getId(), 0L))
                    .createdAt(profile.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminDto.AdminUser updateUserRole(UUID id, String role) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        userRoleRepository.deleteByUserId(id);
        
        UserRole newRole = UserRole.builder()
                .user(profile)
                .role(role.toUpperCase())
                .build();
        userRoleRepository.save(newRole);

        long docCount = documentRepository.countByUserId(id);

        return AdminDto.AdminUser.builder()
                .id(profile.getId())
                .name(profile.getName())
                .email(profile.getEmail())
                .role(role.toUpperCase())
                .enabled(profile.isEnabled())
                .documentCount(docCount)
                .createdAt(profile.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public AdminDto.AdminUser updateUserStatus(UUID id, boolean enabled) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        profile.setEnabled(enabled);
        Profile saved = profileRepository.save(profile);

        List<UserRole> roles = userRoleRepository.findByUserId(id);
        String mainRole = roles.stream()
                .map(UserRole::getRole)
                .filter(r -> r.equalsIgnoreCase("ADMIN"))
                .findFirst()
                .orElse("USER");

        long docCount = documentRepository.countByUserId(id);

        return AdminDto.AdminUser.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(mainRole)
                .enabled(saved.isEnabled())
                .documentCount(docCount)
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Delete all files in storage for this user first
        List<Document> userDocs = documentRepository.findByUserIdOrderByCreatedAtDesc(id);
        for (Document doc : userDocs) {
            storageService.deleteFile(doc.getStoragePath());
        }

        // Cascade deletes entities linked to profile via foreign key cascades
        profileRepository.delete(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> getDocuments() {
        List<Document> docs = documentRepository.findAll();
        return docs.stream().map(doc -> DocumentDto.DocumentResponse.builder()
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
                .build()
        ).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteDocument(UUID id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        storageService.deleteFile(doc.getStoragePath());
        documentRepository.delete(doc);
    }

    @Override
    @Transactional
    public void retryDocument(UUID id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        doc.setStatus(DocumentStatus.PROCESSING);
        doc.setProcessingProgress(10);
        doc.setErrorMessage(null);
        doc.setUpdatedAt(Instant.now());
        documentRepository.save(doc);

        documentService.processDocumentAsync(id);
    }

    @Override
    public AdminDto.SystemHealth getSystemHealth() {
        String dbStatus = "UP";
        String aiStatus = "UP";
        String storageStatus = "UP";
        Map<String, String> details = new HashMap<>();

        try {
            profileRepository.count();
        } catch (Exception e) {
            dbStatus = "DOWN";
            details.put("database", e.getMessage());
        }

        try {
            geminiService.generateEmbedding("health check");
        } catch (Exception e) {
            aiStatus = "DOWN";
            details.put("aiService", e.getMessage());
        }

        try {
            // Check storage by searching list metadata for dummy path
            storageService.downloadFile("health-check-dummy-file-that-does-not-exist");
        } catch (Exception e) {
            // Note: downloading non-existent file will fail, but if it is connection error it will say connection refused.
            // If it is 404, the storage bucket works. So we check if message says 404/not found.
            if (e.getMessage() != null && e.getMessage().contains("Connection")) {
                storageStatus = "DOWN";
                details.put("storage", e.getMessage());
            }
        }

        return AdminDto.SystemHealth.builder()
                .backend("UP")
                .database(dbStatus)
                .vectorStore(dbStatus)
                .aiService(aiStatus)
                .storage(storageStatus)
                .details(details)
                .build();
    }
}
