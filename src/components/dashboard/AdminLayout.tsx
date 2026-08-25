import type { ReactNode } from "react";
import { AppShell } from "@/components/dashboard/AppShell";
import { AdminRoute } from "@/routes-guards/AdminRoute";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <AppShell variant="admin">{children}</AppShell>
    </AdminRoute>
  );
}
