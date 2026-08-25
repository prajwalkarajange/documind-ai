export interface ChatSource {
  fileName: string;
  pageNumber: number | null;
  content?: string | null;
}

export interface ChatAnswer {
  answer: string;
  sources: ChatSource[];
  sessionId?: string;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: ChatSource[];
  createdAt: string;
}

export interface ChatSessionSummary {
  id: string;
  documentId: string;
  documentName?: string;
  title?: string;
  firstQuestion?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatMessage[];
}