import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DocuMind AI — Chat with your documents" },
      {
        name: "description",
        content:
          "DocuMind AI turns your PDFs into searchable knowledge with AI answers and source citations.",
      },
      { property: "og:title", content: "DocuMind AI" },
      {
        property: "og:description",
        content: "Upload PDFs, get instant AI answers with citations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@DocuMindAI" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";

function AppContent() {
  const { backendStatus, retryConnection } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  if (!isLandingPage && backendStatus !== "awake") {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
        <div className="flex max-w-md w-full flex-col items-center justify-center gap-6 rounded-lg border border-border bg-card p-8 shadow-sm">
          {backendStatus === "checking" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-card-foreground">Checking connection...</h3>
                <p className="text-sm text-muted-foreground">Connecting to DocuMind AI services.</p>
              </div>
            </>
          )}

          {(backendStatus === "waking_up" || backendStatus === "slow") && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-card-foreground">Starting AI backend...</h3>
                <p className="text-sm text-muted-foreground text-pretty">
                  This may take up to a minute if the server was inactive. Please wait while we connect to the AI service.
                </p>
              </div>
            </>
          )}

          {backendStatus === "unavailable" && (
            <>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive font-bold text-lg">!</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-card-foreground text-destructive">Backend is taking longer than expected</h3>
                <p className="text-sm text-muted-foreground">
                  We are having trouble establishing a connection to the AI backend. Please verify your connection or try again.
                </p>
              </div>
              <button
                onClick={retryConnection}
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {isLandingPage && backendStatus !== "awake" && backendStatus !== "checking" && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-xs font-medium text-primary flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Starting AI backend... This may take up to a minute if the server was inactive. Please wait while we connect.</span>
        </div>
      )}
      <Outlet />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
