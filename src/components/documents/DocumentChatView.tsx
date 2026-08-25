import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Loader2, Quote, Send, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { FullPageLoader } from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { isProcessing, useDocument } from "@/hooks/useDocuments";
import { useAskQuestion } from "@/hooks/useChat";
import { formatBytes, formatDateTime } from "@/lib/format";
import { errorMessage } from "@/services/api";
import type { ChatMessage } from "@/types/chat";

export function DocumentChatView({ documentId }: { documentId: string }) {
  const document = useDocument(documentId);
  const ask = useAskQuestion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [question, setQuestion] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, ask.isPending]);

  const doc = document.data;
  const ready = doc?.status === "COMPLETED";

  const suggestions = useMemo(
    () => ["Summarize this document", "What are the key findings?", "List any dates or deadlines"],
    [],
  );

  const submit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || ask.isPending) return;
    setQuestion("");
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "USER",
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const answer = await ask.mutateAsync({ documentId, question: trimmed, ...(sessionId ? { sessionId } : {}) });
      if (answer.sessionId) setSessionId(answer.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: answer.answer,
          sources: answer.sources,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (document.isLoading) return <FullPageLoader label="Loading document" />;
  if (document.isError || !doc)
    return <ErrorState error={document.error} onRetry={() => void document.refetch()} />;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/documents">
          <ArrowLeft className="size-4" /> All documents
        </Link>
      </Button>

      <PageHeader
        title={doc.fileName}
        description={`${formatBytes(doc.fileSize)} · ${doc.pageCount ?? "—"} pages · ${doc.chunkCount ?? "—"} chunks · uploaded ${formatDateTime(doc.createdAt)}`}
        actions={<StatusBadge status={doc.status} />}
      />

      {isProcessing(doc) && (
        <Card className="rounded-2xl border-primary/25 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-5">
            <Loader2 className="size-4 animate-spin text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Processing your document…</p>
              <Progress value={doc.processingProgress ?? undefined} className="mt-2 max-w-sm" />
            </div>
          </CardContent>
        </Card>
      )}

      {doc.status === "FAILED" && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">Processing failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.errorMessage ?? "The document could not be indexed. Try uploading it again."}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" /> Ask this document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
                <FileText className="mx-auto size-5 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  {ready ? "Ask anything about this document" : "Chat unlocks once indexing completes"}
                </p>
                {ready && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {suggestions.map((item) => (
                      <Button key={item} size="sm" variant="outline" onClick={() => void submit(item)}>
                        {item}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((message) =>
              message.role === "USER" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="space-y-2">
                  <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-3">
                    <div className="prose prose-sm max-w-none text-sm text-foreground">
                      <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                    </div>
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="max-w-[92%] space-y-2 rounded-2xl bg-accent/50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Quote className="size-3.5" /> Sources
                      </p>
                      {message.sources.map((source, index) => (
                        <div key={`${message.id}-source-${index}`} className="text-xs text-muted-foreground">
                          <Badge variant="outline" className="mr-2 rounded-full">
                            {source.fileName}
                            {source.pageNumber != null ? ` · p.${source.pageNumber}` : ""}
                          </Badge>
                          {source.content && <span className="line-clamp-2">{source.content}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}

            {ask.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" /> Retrieving passages…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(question);
            }}
          >
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit(question);
                }
              }}
              placeholder={ready ? "Ask a question about this document…" : "Waiting for indexing to finish…"}
              disabled={!ready || ask.isPending}
              rows={2}
              className="resize-none"
            />
            <Button type="submit" size="icon" disabled={!ready || ask.isPending || !question.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
