import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { ProtectedRoute } from "@/routes-guards/ProtectedRoute";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profileService";
import { errorMessage } from "@/services/api";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — DocuMind AI" },
      { name: "description", content: "Manage your DocuMind AI account details." },
      { property: "og:title", content: "Profile — DocuMind AI" },
      { property: "og:description", content: "Update your display name and review account info." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <AppShell>
        <ProfilePage />
      </AppShell>
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const update = useMutation({
    mutationFn: (value: string) => profileService.update({ name: value }),
    onSuccess: (fresh) => {
      setUser(fresh);
      toast.success("Profile updated.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" description="Your account details and preferences." />

      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Email and role are managed by your administrator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) {
                toast.error("Name cannot be empty.");
                return;
              }
              update.mutate(name.trim());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} readOnly disabled />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary">
                {user?.role ?? "USER"}
              </Badge>
              {user?.createdAt && (
                <span className="text-xs text-muted-foreground">
                  Member since {formatDateTime(user.createdAt)}
                </span>
              )}
            </div>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="size-4 animate-spin" />} Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
