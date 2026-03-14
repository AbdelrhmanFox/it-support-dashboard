"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, LogOut, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { useLocale } from "@/components/locale-provider";
import { useBranch } from "@/components/branch-provider";
import { RoleBadge } from "@/components/role-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface TopBarBreadcrumb {
  parent: string;
  parentHref: string;
  current: string;
}

interface TopBarProps {
  title?: string;
  breadcrumb?: TopBarBreadcrumb;
  className?: string;
  onMenuClick?: () => void;
}

export function TopBar({ title = "Dashboard", breadcrumb, className, onMenuClick }: TopBarProps) {
  const { setTheme } = useTheme();
  const { setLocale, locale } = useLocale();
  const { role, branchLabel } = useBranch();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const titleContent = breadcrumb ? (
    <span className="flex items-center text-base font-medium text-foreground">
      <Link
        href={breadcrumb.parentHref}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {breadcrumb.parent}
      </Link>
      <ChevronRight className="mx-1 size-3.5 shrink-0 text-muted-foreground" />
      <span className="font-semibold text-foreground">{breadcrumb.current}</span>
    </span>
  ) : (
    <h1 className="text-base font-semibold text-foreground">{title}</h1>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-topbar items-center gap-4 border-b border-border bg-card px-4 shadow-sm lg:px-6",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        {titleContent}
      </div>

      <div className="flex items-center gap-1">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-xs font-medium"
              aria-label="Language"
            >
              {locale === "ar" ? "ع" : "EN"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocale("ar")}>العربية (RTL)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-6 w-px bg-border" aria-hidden />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-full bg-primary/10 p-0 text-xs font-semibold text-primary hover:bg-primary/20"
                aria-label="User menu"
              >
                {user.email?.slice(0, 2).toUpperCase() ?? "?"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium">{user.email}</div>
              <div className="flex items-center gap-2 px-2 pb-1.5 text-xs text-muted-foreground">
                <RoleBadge />
                {role === "admin" ? (
                  <span>• All branches</span>
                ) : (
                  <span>• {branchLabel}</span>
                )}
              </div>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
