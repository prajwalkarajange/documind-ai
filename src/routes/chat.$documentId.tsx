import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { ProtectedRoute } from "@/routes-guards/ProtectedRoute";
import { DocumentChatView } from "@/components/documents/DocumentChatView";

export const Route = createFileRoute("/chat/$documentId")({
  head: () => ({
    meta: [
      { title: "Chat with your document — DocuMind AI" },
      {
        name: "description",
        content: "Ask questions about an indexed PDF and get cited, retrieval-augmented answers.",
      },
      { property: "og:title", content: "Chat with your document — DocuMind AI" },
      {
        property: "og:description",
        content: "Answers grounded in your own document, with file and page citations.",
      },
    ],
  }),
  component: ChatRoute,
});

function ChatRoute() {
  const { documentId } = Route.useParams();
  return (
    <ProtectedRoute>
      <AppShell>
        <DocumentChatView documentId={documentId} />
      </AppShell>
    </ProtectedRoute>
  );
}
