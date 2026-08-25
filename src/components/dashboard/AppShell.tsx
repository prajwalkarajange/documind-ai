import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  FileText,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Server,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const USER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", to: "/documents", icon: Files },
  { label: "Chat History", to: "/chat-history", icon: MessagesSquare },
  { label: "Profile", to: "/profile", icon: UserRound },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Documents", to: "/admin/documents", icon: FileText },
  { label: "Processing", to: "/admin/processing", icon: Activity },
  { label: "System Statistics", to: "/admin/system", icon: Server },
];

function NavList({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: (() => void) | undefined;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.to === "/admin" || item.to === "/dashboard"
            ? pathname === item.to
            : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  items,
  variant,
  onNavigate,
}: {
  items: NavItem[];
  variant: "user" | "admin";
  onNavigate?: (() => void) | undefined;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    void navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <Brand />
        {variant === "admin" && (
          <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary">
            Admin
          </Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavList items={items} onNavigate={onNavigate} />
      </div>
      <div className="space-y-3 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-1">
          <Avatar className="size-9">
            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="size-4.5" /> Log out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  variant = "user",
}: {
  children: ReactNode;
  variant?: "user" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const items = variant === "admin" ? ADMIN_NAV : USER_NAV;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarBody items={items} variant={variant} />
      </aside>

      <div className="lg:pl-68">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody items={items} variant={variant} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Brand />
          {variant === "admin" && <Settings2 className="ml-auto size-4 text-muted-foreground" />}
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}