import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoader } from "@/components/common/FullPageLoader";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (user && user.role !== "ADMIN") {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  if (isLoading || !isAuthenticated || !user) return <FullPageLoader />;
  if (user.role !== "ADMIN") return <FullPageLoader label="Redirecting" />;
  return <>{children}</>;
}