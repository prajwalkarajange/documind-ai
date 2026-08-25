package com.documind.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class SupabaseStorageServiceImpl implements SupabaseStorageService {

    private final WebClient webClient;

    @Value("${app.supabase.url}")
    private String supabaseUrl;

    @Value("${app.supabase.service-role-key}")
    private String serviceRoleKey;

    public SupabaseStorageServiceImpl(WebClient webClient) {
        this.webClient = webClient;
    }

    private String getBucketUrl() {
        return supabaseUrl.replaceAll("/$", "") + "/storage/v1/object/documents/";
    }

    @Override
    public String uploadFile(String storagePath, byte[] fileBytes, String contentType) {
        String url = getBucketUrl() + storagePath;
        try {
            webClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .contentType(MediaType.parseMediaType(contentType))
                    .bodyValue(fileBytes)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return storagePath;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to Supabase Storage: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] downloadFile(String storagePath) {
        String url = getBucketUrl() + storagePath;
        try {
            return webClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from Supabase Storage: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String storagePath) {
        String url = getBucketUrl() + storagePath;
        try {
            webClient.delete()
                    .uri(url)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (Exception e) {
            // Log warning but don't fail operation if database needs cleanup anyway
            System.err.println("Warning: failed to delete file from Supabase Storage: " + e.getMessage());
        }
    }
}
