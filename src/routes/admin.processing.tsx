import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/adminService";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/processing")({
  head: () => ({
    meta: [
      { title: "Processing queue — DocuMind AI admin" },
      { name: "description", content: "Live view of document extraction, embedding and indexing jobs." },
      { property: "og:title", content: "Processing queue — DocuMind AI admin" },
      { property: "og:description", content: "Real-time ingestion pipeline monitoring." },
    ],
  }),
  component: () => (
    <AdminLayout>
      <AdminProcessingPage />
    </AdminLayout>
  ),
});

function AdminProcessingPage() {
  const jobs = useQuery({
    queryKey: ["admin", "processing"],
    queryFn: () => adminService.processing(),
    refetchInterval: 4000,
  });

  const rows = jobs.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processing queue"
        description="Refreshes automatically every few seconds."
      />

      {jobs.isLoading ? (
        <Skeleton className="h-56 w-full rounded-2xl" />
      ) : jobs.isError ? (
        <ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Queue is empty"
          description="No documents are currently being processed."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((job) => (
            <Card key={job.id} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{job.documentName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.ownerName ?? job.ownerEmail ?? "—"} · started {formatDateTime(job.startedAt)}
                    {job.stage ? ` · ${job.stage}` : ""}
                  </p>
                  <Progress value={job.progress ?? undefined} className="mt-2 max-w-md" />
                  {job.errorMessage && (
                    <p className="mt-1 text-xs text-destructive">{job.errorMessage}</p>
                  )}
                </div>
                <StatusBadge status={job.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
