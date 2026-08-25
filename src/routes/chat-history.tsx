import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { ProtectedRoute } from "@/routes-guards/ProtectedRoute";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useChatHistory, useDeleteChatSession } from "@/hooks/useChat";
import { formatDateTime } from "@/lib/format";
import { errorMessage } from "@/services/api";

export const Route = createFileRoute("/chat-history")({
  head: () => ({
    meta: [
      { title: "Chat history — DocuMind AI" },
      { name: "description", content: "Revisit your previous document conversations and answers." },
      { property: "og:title", content: "Chat history — DocuMind AI" },
      { property: "og:description", content: "All of your past document Q&A sessions in one place." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AppShell>
        <ChatHistoryPage />
      </AppShell>
    </ProtectedRoute>
  ),
});

function ChatHistoryPage() {
  const history = useChatHistory();
  const remove = useDeleteChatSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove.mutateAsync(id);
      toast.success("Conversation deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const sessions = history.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Chat history" description="Every question you have asked your documents." />

      {history.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : history.isError ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Open an indexed document and ask your first question."
          action={
            <Button asChild size="sm">
              <Link to="/documents">Browse documents</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <Card key={session.id} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {session.title ?? session.firstQuestion ?? "Untitled conversation"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.documentName ?? "Document"} · {session.messageCount ?? 0} messages ·{" "}
                    {formatDateTime(session.updatedAt ?? session.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    Session
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/documents/$documentId" params={{ documentId: session.documentId }}>
                      Open document
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete conversation"
                    disabled={deletingId === session.id}
                    onClick={() => void handleDelete(session.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
