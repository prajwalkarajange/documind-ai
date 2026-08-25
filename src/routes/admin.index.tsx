import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  FileText,
  MessagesSquare,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/services/adminService";
import type { TimeSeriesPoint } from "@/types/admin";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — DocuMind AI" },
      { name: "description", content: "Platform-wide usage, processing and user statistics." },
      { property: "og:title", content: "Admin dashboard — DocuMind AI" },
      { property: "og:description", content: "Monitor users, documents and RAG activity." },
    ],
  }),
  component: () => (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  ),
});

function TrendCard({ title, data }: { title: string; data: TimeSeriesPoint[] }) {
  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2}
              fill={`url(#fill-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminService.stats() });
  const data = stats.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin dashboard" description="Platform activity across all users." />

      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Users" value={data?.totalUsers} icon={Users} loading={stats.isLoading} />
            <StatCard
              label="Documents"
              value={data?.totalDocuments}
              icon={FileText}
              loading={stats.isLoading}
            />
            <StatCard
              label="Questions asked"
              value={data?.totalQuestions}
              icon={MessagesSquare}
              loading={stats.isLoading}
            />
            <StatCard
              label="Indexed"
              value={data?.processedDocuments}
              icon={CheckCircle2}
              tone="success"
              loading={stats.isLoading}
            />
            <StatCard
              label="Processing"
              value={data?.processingDocuments}
              icon={Activity}
              tone="warning"
              loading={stats.isLoading}
            />
            <StatCard
              label="Failed"
              value={data?.failedDocuments}
              icon={TriangleAlert}
              tone="danger"
              loading={stats.isLoading}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {data?.documentsOverTime && data.documentsOverTime.length > 0 && (
              <TrendCard title="Documents over time" data={data.documentsOverTime} />
            )}
            {data?.questionsOverTime && data.questionsOverTime.length > 0 && (
              <TrendCard title="Questions over time" data={data.questionsOverTime} />
            )}
            {data?.newUsersOverTime && data.newUsersOverTime.length > 0 && (
              <TrendCard title="New users over time" data={data.newUsersOverTime} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
