import type { Role } from "./auth";
import type { DocumentStatus } from "./document";

export interface AdminStats {
  totalUsers: number;
  totalDocuments: number;
  totalQuestions: number;
  processedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  newUsersOverTime?: TimeSeriesPoint[];
  documentsOverTime?: TimeSeriesPoint[];
  questionsOverTime?: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  enabled: boolean;
  documentCount?: number;
  createdAt: string;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  documentName: string;
  ownerEmail?: string;
  ownerName?: string;
  status: DocumentStatus;
  stage?: string | null;
  progress?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export type HealthState = "UP" | "DOWN" | "DEGRADED" | "UNKNOWN";

export interface SystemHealth {
  backend?: HealthState;
  database?: HealthState;
  vectorStore?: HealthState;
  aiService?: HealthState;
  storage?: HealthState;
  details?: Record<string, string>;
}