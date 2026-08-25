import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Files, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { ProtectedRoute } from "@/routes-guards/ProtectedRoute";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UploadCard } from "@/components/documents/UploadCard";
import { isProcessing, useDeleteDocument, useDocuments } from "@/hooks/useDocuments";
import { formatBytes, formatDateTime } from "@/lib/format";
import { errorMessage } from "@/services/api";

export const Route = createFileRoute("/documents/")({
  head: () => ({
    meta: [
      { title: "Documents — DocuMind AI" },
      { name: "description", content: "Upload, monitor and manage the PDFs in your knowledge base." },
      { property: "og:title", content: "Documents — DocuMind AI" },
      { property: "og:description", content: "Your indexed PDF library with live processing status." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AppShell>
        <DocumentsPage />
      </AppShell>
    </ProtectedRoute>
  ),
});

function DocumentsPage() {
  const documents = useDocuments();
  const remove = useDeleteDocument();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; fileName: string } | null>(null);

  const docs = (documents.data ?? []).filter((doc) =>
    doc.fileName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success("Document deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Everything you have indexed into DocuMind AI." />

      <UploadCard />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search documents"
          className="pl-9"
        />
      </div>

      {documents.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : documents.isError ? (
        <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={Files}
          title={query ? "No matching documents" : "No documents yet"}
          description={query ? "Try a different search term." : "Upload a PDF above to get started."}
        />
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <Link
                    to="/documents/$documentId"
                    params={{ documentId: doc.id }}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {doc.fileName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.fileSize)} · {doc.pageCount ?? "—"} pages ·{" "}
                    {doc.chunkCount ?? "—"} chunks · {formatDateTime(doc.createdAt)}
                  </p>
                  {isProcessing(doc) && (
                    <Progress value={doc.processingProgress ?? undefined} className="mt-2 max-w-xs" />
                  )}
                  {doc.status === "FAILED" && doc.errorMessage && (
                    <p className="text-xs text-destructive">{doc.errorMessage}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={doc.status} />
                  <Button asChild size="sm" variant="outline" disabled={doc.status !== "COMPLETED"}>
                    <Link to="/documents/$documentId" params={{ documentId: doc.id }}>
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${doc.fileName}`}
                    onClick={() => setPendingDelete({ id: doc.id, fileName: doc.fileName })}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.fileName} and its embeddings will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
