import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminService } from "@/services/adminService";
import { errorMessage } from "@/services/api";
import { formatBytes, formatDateTime } from "@/lib/format";
import { isProcessing } from "@/hooks/useDocuments";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({
    meta: [
      { title: "All documents — DocuMind AI admin" },
      { name: "description", content: "Review, retry and remove documents across all users." },
      { property: "og:title", content: "All documents — DocuMind AI admin" },
      { property: "og:description", content: "Platform-wide document oversight." },
    ],
  }),
  component: () => (
    <AdminLayout>
      <AdminDocumentsPage />
    </AdminLayout>
  ),
});

function AdminDocumentsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const documents = useQuery({
    queryKey: ["admin", "documents"],
    queryFn: () => adminService.documents(),
    refetchInterval: (result) => {
      const data = result.state.data;
      return data?.some(isProcessing) ? 5000 : false;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
  };

  const retry = useMutation({
    mutationFn: (id: string) => adminService.retryDocument(id),
    onSuccess: () => {
      toast.success("Reprocessing started.");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminService.deleteDocument(id),
    onSuccess: () => {
      toast.success("Document deleted.");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rows = (documents.data ?? []).filter((doc) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      doc.fileName.toLowerCase().includes(term) ||
      (doc.ownerEmail ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All documents" description="Every document uploaded to the platform." />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by file or owner"
          className="pl-9"
        />
      </div>

      {documents.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : documents.isError ? (
        <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={FileText} title="No documents found" description="Try a different search." />
      ) : (
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-soft">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <p className="max-w-64 truncate text-sm font-medium text-foreground">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.ownerName ?? doc.ownerEmail ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                      {doc.status === "FAILED" && doc.errorMessage && (
                        <p className="mt-1 max-w-56 truncate text-xs text-destructive">
                          {doc.errorMessage}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.chunkCount ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(doc.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Retry ${doc.fileName}`}
                        disabled={retry.isPending}
                        onClick={() => retry.mutate(doc.id)}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${doc.fileName}`}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(doc.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
