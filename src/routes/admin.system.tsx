import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Brain, Database, HardDrive, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminService } from "@/services/adminService";
import { cn } from "@/lib/utils";
import type { HealthState } from "@/types/admin";

export const Route = createFileRoute("/admin/system")({
  head: () => ({
    meta: [
      { title: "System statistics — DocuMind AI admin" },
      { name: "description", content: "Health of the API, database, vector store and AI service." },
      { property: "og:title", content: "System statistics — DocuMind AI admin" },
      { property: "og:description", content: "Infrastructure health at a glance." },
    ],
  }),
  component: () => (
    <AdminLayout>
      <AdminSystemPage />
    </AdminLayout>
  ),
});

const SERVICES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "backend", label: "API backend", icon: Server },
  { key: "database", label: "Database", icon: Database },
  { key: "vectorStore", label: "Vector store", icon: Boxes },
  { key: "aiService", label: "AI service", icon: Brain },
  { key: "storage", label: "File storage", icon: HardDrive },
];

function stateTone(state: HealthState) {
  if (state === "UP") return "border-success/25 bg-success/12 text-success";
  if (state === "DOWN") return "border-destructive/25 bg-destructive/10 text-destructive";
  if (state === "DEGRADED") return "border-warning/30 bg-warning/15 text-warning-foreground";
  return "border-border bg-muted text-muted-foreground";
}

function AdminSystemPage() {
  const health = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => adminService.health(),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="System statistics" description="Live health of platform dependencies." />

      {health.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : health.isError ? (
        <ErrorState error={health.error} onRetry={() => void health.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((service) => {
              const state = ((health.data ?? {}) as Record<string, HealthState | undefined>)[
                service.key
              ] ?? "UNKNOWN";
              return (
                <Card key={service.key} className="rounded-2xl border-border/70 shadow-soft">
                  <CardContent className="flex items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <span className="bg-accent flex size-10 items-center justify-center rounded-xl">
                        <service.icon className="size-5 text-accent-foreground" />
                      </span>
                      <p className="text-sm font-medium text-foreground">{service.label}</p>
                    </div>
                    <Badge variant="outline" className={cn("rounded-full", stateTone(state))}>
                      {state}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {health.data?.details && Object.keys(health.data.details).length > 0 && (
            <Card className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground">Details</p>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(health.data.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3 text-sm">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="truncate font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
