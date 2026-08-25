import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/common/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/services/api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    const result: { redirect?: string; expired?: boolean } = {};
    if (typeof search['redirect'] === "string") result.redirect = search['redirect'];
    if (search['expired'] === "1" || search['expired'] === 1) result.expired = true;
    return result;
  },
  head: () => ({
    meta: [
      { title: "Log in — DocuMind AI" },
      { name: "description", content: "Log in to your DocuMind AI document workspace." },
      { property: "og:title", content: "Log in — DocuMind AI" },
      { property: "og:description", content: "Access your documents and AI chat history." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect, expired } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${user.name}`);
      const target = user.role === "ADMIN" ? "/admin" : (redirect ?? "/dashboard");
      void navigate({ to: target, replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <Brand />
          </Link>
        </div>
        <Card className="rounded-2xl border-border/70 shadow-lift">
          <CardHeader>
            <CardTitle className="text-xl">Log in</CardTitle>
            <CardDescription>
              {expired ? "Your session expired. Please log in again." : "Welcome back to DocuMind AI."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />} Log in
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
