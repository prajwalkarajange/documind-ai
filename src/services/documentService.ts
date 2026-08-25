import type { DocumentItem, DocumentStatusResponse } from "@/types/document";
import { apiRequest, apiUpload } from "./api";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const documentService = {
  list() {
    return apiRequest<DocumentItem[]>("/documents");
  },
  get(id: string) {
    return apiRequest<DocumentItem>(`/documents/${id}`);
  },
  status(id: string) {
    return apiRequest<DocumentStatusResponse>(`/documents/${id}/status`);
  },
  remove(id: string) {
    return apiRequest<void>(`/documents/${id}`, { method: "DELETE" });
  },
  upload(file: File, onProgress?: (percent: number) => void) {
    return apiUpload<DocumentItem>("/documents/upload", file, onProgress);
  },
};