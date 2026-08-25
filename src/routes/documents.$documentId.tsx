import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { ProtectedRoute } from "@/routes-guards/ProtectedRoute";
import { DocumentChatView } from "@/components/documents/DocumentChatView";

export const Route = createFileRoute("/documents/$documentId")({
  head: () => ({
    meta: [
      { title: "Document chat — DocuMind AI" },
      {
        name: "description",
        content: "Ask questions about this document and get answers with page-level citations.",
      },
      { property: "og:title", content: "Document chat — DocuMind AI" },
      { property: "og:description", content: "Retrieval-augmented answers grounded in your PDF." },
    ],
  }),
  component: DocumentDetailRoute,
});

function DocumentDetailRoute() {
  const { documentId } = Route.useParams();
  return (
    <ProtectedRoute>
      <AppShell>
        <DocumentChatView documentId={documentId} />
      </AppShell>
    </ProtectedRoute>
  );
}
