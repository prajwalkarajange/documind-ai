import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Files, Loader2, MessagesSquare, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { ProtectedRoute } from "@/routes-guards/ProtectedRoute";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCard } from "@/components/documents/UploadCard";
import { isProcessing, useDocuments } from "@/hooks/useDocuments";
import { useChatHistory } from "@/hooks/useChat";
import { formatBytes, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DocuMind AI" },
      { name: "description", content: "Your document processing overview and recent activity." },
      { property: "og:title", content: "Dashboard — DocuMind AI" },
      { property: "og:description", content: "Track uploads, processing status and chat activity." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </ProtectedRoute>
  ),
});

function DashboardPage() {
  const documents = useDocuments();
  const history = useChatHistory();
  const docs = documents.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Upload documents, watch them get indexed, then ask questions."
        actions={
          <Button asChild>
            <Link to="/documents">Go to documents</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents" value={docs.length} icon={Files} loading={documents.isLoading} />
        <StatCard
          label="Indexed"
          value={docs.filter((doc) => doc.status === "COMPLETED").length}
          icon={CheckCircle2}
          tone="success"
          loading={documents.isLoading}
        />
        <StatCard
          label="Processing"
          value={docs.filter(isProcessing).length}
          icon={Loader2}
          tone="warning"
          loading={documents.isLoading}
        />
        <StatCard
          label="Chat sessions"
          value={history.data?.length}
          icon={MessagesSquare}
          loading={history.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <UploadCard />

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Recent documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.isError ? (
              <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />
            ) : docs.length === 0 ? (
              <EmptyState
                icon={Files}
                title="No documents yet"
                description="Upload your first PDF to start building your knowledge base."
              />
            ) : (
              <ul className="divide-y divide-border/70">
                {docs.slice(0, 6).map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to="/documents/$documentId"
                        params={{ documentId: doc.id }}
                        className="truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {doc.fileName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBytes(doc.fileSize)} · {formatDateTime(doc.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {docs.some((doc) => doc.status === "FAILED") && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-5">
            <TriangleAlert className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">Some documents failed to process</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open the document to see the error detail, then re-upload or ask an admin to retry it.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
