import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";

export function useChatHistory() {
  return useQuery({ queryKey: ["chat-history"], queryFn: () => chatService.history() });
}

export function useChatSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => chatService.session(sessionId as string),
    enabled: Boolean(sessionId),
  });
}

export function useAskQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { documentId: string; question: string; sessionId?: string }) =>
      chatService.ask(input.documentId, input.question, input.sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => chatService.removeSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
  });
}