package com.documind.service;

import com.documind.dto.AdminDto;
import com.documind.dto.DocumentDto;

import java.util.List;
import java.util.UUID;

public interface AdminService {
    AdminDto.AdminStats getStats();
    List<AdminDto.AdminUser> getUsers();
    AdminDto.AdminUser updateUserRole(UUID id, String role);
    AdminDto.AdminUser updateUserStatus(UUID id, boolean enabled);
    void deleteUser(UUID id);
    List<DocumentDto.DocumentResponse> getDocuments();
    void deleteDocument(UUID id);
    void retryDocument(UUID id);
    AdminDto.SystemHealth getSystemHealth();
}
