import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminService } from "@/services/adminService";
import { errorMessage } from "@/services/api";
import { formatDate } from "@/lib/format";
import type { Role } from "@/types/auth";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — DocuMind AI admin" },
      { name: "description", content: "Manage user roles, access and accounts." },
      { property: "og:title", content: "Users — DocuMind AI admin" },
      { property: "og:description", content: "Role-based user administration." },
    ],
  }),
  component: () => (
    <AdminLayout>
      <AdminUsersPage />
    </AdminLayout>
  ),
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminService.users() });
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; email: string } | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminService.updateRole(id, role),
    onSuccess: () => {
      toast.success("Role updated.");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      adminService.updateStatus(id, enabled),
    onSuccess: () => {
      toast.success("Account status updated.");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted.");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rows = (users.data ?? []).filter((user) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Roles, access and account management." />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="pl-9"
        />
      </div>

      {users.isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search." />
      ) : (
        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-soft">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          roleMutation.mutate({ id: user.id, role: value as Role })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.documentCount ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.enabled}
                        aria-label={`Toggle access for ${user.email}`}
                        onCheckedChange={(checked) =>
                          statusMutation.mutate({ id: user.id, enabled: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${user.email}`}
                        onClick={() => setPendingDelete({ id: user.id, email: user.email })}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.email} and all of their documents will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
