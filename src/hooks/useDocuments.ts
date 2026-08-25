import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentService } from "@/services/documentService";
import type { DocumentItem } from "@/types/document";

const ACTIVE_STATUSES = ["UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING", "INDEXING", "PROCESSING"];

export function isProcessing(doc: Pick<DocumentItem, "status">) {
  return ACTIVE_STATUSES.includes(doc.status);
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: () => documentService.list(),
    refetchInterval: (query) => {
      const data = query.state.data as DocumentItem[] | undefined;
      return data?.some(isProcessing) ? 3000 : false;
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentService.get(id),
    refetchInterval: (query) => {
      const data = query.state.data as DocumentItem | undefined;
      return data && isProcessing(data) ? 2500 : false;
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}