import type { ChatAnswer, ChatSessionDetail, ChatSessionSummary } from "@/types/chat";
import { apiRequest } from "./api";

export const chatService = {
  ask(documentId: string, question: string, sessionId?: string) {
    return apiRequest<ChatAnswer>("/chat", {
      method: "POST",
      body: sessionId ? { documentId, question, sessionId } : { documentId, question },
    });
  },
  history() {
    return apiRequest<ChatSessionSummary[]>("/chat/history");
  },
  session(sessionId: string) {
    return apiRequest<ChatSessionDetail>(`/chat/${sessionId}`);
  },
  removeSession(sessionId: string) {
    return apiRequest<void>(`/chat/${sessionId}`, { method: "DELETE" });
  },
};