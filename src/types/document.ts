export type DocumentStatus =
  | "UPLOADING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING"
  | "INDEXING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface DocumentItem {
  id: string;
  fileName: string;
  storagePath?: string;
  fileSize: number;
  pageCount?: number | null;
  chunkCount?: number | null;
  status: DocumentStatus;
  processingProgress?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string;
  ownerName?: string;
  ownerEmail?: string;
}

export interface DocumentStatusResponse {
  id: string;
  status: DocumentStatus;
  processingProgress?: number | null;
  chunkCount?: number | null;
  pageCount?: number | null;
  errorMessage?: string | null;
}