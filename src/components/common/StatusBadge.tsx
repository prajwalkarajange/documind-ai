import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types/document";

const LABELS: Record<DocumentStatus, string> = {
  UPLOADING: "Uploading",
  EXTRACTING: "Extracting text",
  CHUNKING: "Chunking",
  EMBEDDING: "Generating embeddings",
  INDEXING: "Indexing vectors",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export function statusLabel(status: DocumentStatus | string): string {
  return LABELS[status as DocumentStatus] ?? String(status);
}

export function StatusBadge({
  status,
  className,
}: {
  status: DocumentStatus | string;
  className?: string;
}) {
  const tone =
    status === "COMPLETED"
      ? "bg-success/12 text-success border-success/25"
      : status === "FAILED"
        ? "bg-destructive/10 text-destructive border-destructive/25"
        : "bg-primary/10 text-primary border-primary/25";

  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", tone, className)}>
      {statusLabel(status)}
    </Badge>
  );
}