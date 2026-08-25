import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoader } from "@/components/common/FullPageLoader";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: pathname }, replace: true });
      return;
    }
    if (user?.role === "ADMIN" && !pathname.startsWith("/admin")) {
      void navigate({ to: "/admin", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, pathname, user?.role]);

  if (isLoading || !isAuthenticated) return <FullPageLoader />;
  return <>{children}</>;
}