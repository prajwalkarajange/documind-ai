package com.documind.controller;

import com.documind.dto.AdminDto;
import com.documind.dto.DocumentDto;
import com.documind.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminDto.AdminStats> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminDto.AdminUser>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminDto.AdminUser> updateUserRole(@PathVariable("id") UUID id, @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null || role.trim().isEmpty()) {
            throw new IllegalArgumentException("Role parameter is required");
        }
        return ResponseEntity.ok(adminService.updateUserRole(id, role.trim()));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<AdminDto.AdminUser> updateUserStatus(@PathVariable("id") UUID id, @RequestBody Map<String, Boolean> body) {
        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            throw new IllegalArgumentException("Enabled parameter is required");
        }
        return ResponseEntity.ok(adminService.updateUserStatus(id, enabled));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") UUID id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DocumentDto.DocumentResponse>> getDocuments() {
        return ResponseEntity.ok(adminService.getDocuments());
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable("id") UUID id) {
        adminService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/documents/{id}/retry")
    public ResponseEntity<Void> retryDocument(@PathVariable("id") UUID id) {
        adminService.retryDocument(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/system/health")
    public ResponseEntity<AdminDto.SystemHealth> getSystemHealth() {
        return ResponseEntity.ok(adminService.getSystemHealth());
    }
}
