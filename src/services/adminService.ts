import type { AdminStats, AdminUser, ProcessingJob, SystemHealth } from "@/types/admin";
import type { DocumentItem } from "@/types/document";
import type { Role } from "@/types/auth";
import { apiRequest } from "./api";

export const adminService = {
  stats() {
    return apiRequest<AdminStats>("/admin/stats");
  },
  users() {
    return apiRequest<AdminUser[]>("/admin/users");
  },
  user(id: string) {
    return apiRequest<AdminUser>(`/admin/users/${id}`);
  },
  updateRole(id: string, role: Role) {
    return apiRequest<AdminUser>(`/admin/users/${id}/role`, { method: "PUT", body: { role } });
  },
  updateStatus(id: string, enabled: boolean) {
    return apiRequest<AdminUser>(`/admin/users/${id}/status`, { method: "PUT", body: { enabled } });
  },
  deleteUser(id: string) {
    return apiRequest<void>(`/admin/users/${id}`, { method: "DELETE" });
  },
  documents() {
    return apiRequest<DocumentItem[]>("/admin/documents");
  },
  document(id: string) {
    return apiRequest<DocumentItem>(`/admin/documents/${id}`);
  },
  deleteDocument(id: string) {
    return apiRequest<void>(`/admin/documents/${id}`, { method: "DELETE" });
  },
  retryDocument(id: string) {
    return apiRequest<void>(`/admin/documents/${id}/retry`, { method: "POST" });
  },
  processing() {
    return apiRequest<ProcessingJob[]>("/admin/processing");
  },
  health() {
    return apiRequest<SystemHealth>("/admin/system/health");
  },
};