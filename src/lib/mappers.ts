import type { DocumentItem, DocumentStatus } from "@/types/document";
import type { ChatMessage, ChatSource } from "@/types/chat";

export interface DocumentRow {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  page_count: number | null;
  chunk_count: number | null;
  status: string;
  processing_progress: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function toDocumentItem(
  row: DocumentRow,
  owner?: { name?: string; email?: string } | null,
): DocumentItem {
  return {
    id: row.id,
    fileName: row.file_name,
    storagePath: row.storage_path,
    fileSize: Number(row.file_size ?? 0),
    pageCount: row.page_count,
    chunkCount: row.chunk_count,
    status: row.status as DocumentStatus,
    processingProgress: row.processing_progress,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(owner?.name ? { ownerName: owner.name } : {}),
    ...(owner?.email ? { ownerEmail: owner.email } : {}),
  };
}

export interface MessageRow {
  id: string;
  role: string;
  content: string;
  sources: unknown;
  created_at: string;
}

export function toChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role === "ASSISTANT" ? "ASSISTANT" : "USER",
    content: row.content,
    sources: Array.isArray(row.sources) ? (row.sources as ChatSource[]) : [],
    createdAt: row.created_at,
  };
}
