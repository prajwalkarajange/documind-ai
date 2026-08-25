package com.documind.service;

public interface SupabaseStorageService {
    String uploadFile(String storagePath, byte[] fileBytes, String contentType);
    byte[] downloadFile(String storagePath);
    void deleteFile(String storagePath);
}
