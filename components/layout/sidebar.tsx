"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  FileText,
  Truck,
  Monitor,
  History,
  Ticket,
  Bell,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranch } from "@/components/branch-provider";
import { BranchSwitcher } from "@/components/branch-switcher";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const navSections = [
  {
    label: null,
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "OPERATIONS",
    items: [
      { title: "Spare Parts", href: "/spare-parts", icon: Package },
      { title: "Inventory", href: "/inventory", icon: Warehouse },
      { title: "Purchase Requests", href: "/purchase-requests", icon: FileText },
      { title: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { title: "Assets", href: "/assets", icon: Monitor },
      { title: "Asset History", href: "/asset-history", icon: History },
      { title: "Tickets", href: "/tickets", icon: Ticket },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
] as const;

const bottomNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function NavLinks({
  pathname,
  collapsed,
  onLinkClick,
}: {
  pathname: string;
  collapsed: boolean;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {navSections.map((section) => (
        <div key={section.label ?? "dashboard"} className="flex flex-col">
          {section.label && !collapsed && (
            <div className="mb-1 mt-4 px-3 text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
              {section.label}
            </div>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-active-bg font-medium text-sidebar-active-fg"
                      : "text-sidebar-muted hover:bg-sidebar-hover-bg hover:text-sidebar-fg"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
              return link;
            })}
          </div>
        </div>
      ))}
      <div className="border-t border-white/10 pt-3 mt-auto" />
    </>
  );
}

function RoleBadgePill({ role }: { role: "admin" | "support" | "viewer" | null }) {
  if (role === "admin")
    return (
      <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
        Admin
      </span>
    );
  if (role === "support")
    return (
      <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
        Support
      </span>
    );
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
      Viewer
    </span>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { branchLabel, role } = useBranch();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);

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

  useEffect(() => {
    setCollapsed(getInitialCollapsed());
    const handler = () => setCollapsed(getInitialCollapsed());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const toggleCollapsed = () => {
    const next = !getInitialCollapsed();
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    setCollapsed(next);
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: next } }));
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="border-b border-white/10 px-4 pt-5 pb-4 mb-3">
        <Link
          href="/"
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-3 font-semibold text-sm text-sidebar-fg",
            collapsed && "justify-center"
          )}
        >
          <Monitor className="h-5 w-5 shrink-0 text-sidebar-active-bg" />
          {!collapsed && <span>{branchLabel} Support</span>}
        </Link>
        {!collapsed && (
          <div className="mt-2">
            <RoleBadgePill role={role} />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3">
        <NavLinks
          pathname={pathname}
          collapsed={collapsed}
          onLinkClick={onMobileClose}
        />
      </nav>

      {/* Footer: branch + user, then Settings, then collapse (desktop only) */}
      <div className="border-t border-white/10 px-3 pt-3 mt-auto shrink-0">
        {!collapsed && (
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {role === "admin" && (
              <div className="flex flex-1 min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-sidebar-fg [&_.border]:border-white/10 [&_.bg-background]:bg-white/5 [&_.text-muted-foreground]:text-sidebar-muted">
                <span className="text-[10px] uppercase tracking-wider text-sidebar-muted shrink-0">Branch</span>
                <BranchSwitcher />
              </div>
            )}
            {user && (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-sidebar-fg">
                  {user.email?.slice(0, 2).toUpperCase() ?? "?"}
                </div>
                <span className="truncate text-xs text-sidebar-muted">
                  {user.email}
                </span>
              </div>
            )}
          </div>
        )}
        {bottomNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-active-bg font-medium text-sidebar-active-fg"
                  : "text-sidebar-muted hover:bg-sidebar-hover-bg hover:text-sidebar-fg"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
        <div className="hidden lg:flex justify-center pb-2 pt-1">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded p-1 text-sidebar-muted hover:text-sidebar-fg transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );

  const sidebarClassName = cn(
    "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar-bg shadow-[4px_0_24px_rgba(0,0,0,0.15)] transition-all duration-200 ease-in-out",
    collapsed ? "w-sidebar-collapsed" : "w-sidebar",
    "hidden lg:flex"
  );

  return (
    <>
      <aside className={sidebarClassName}>{sidebarContent}</aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          onKeyDown={(e) => e.key === "Escape" && onMobileClose?.()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          "sidebar-slide fixed left-0 top-0 z-50 flex h-screen w-sidebar flex-col bg-sidebar-bg shadow-xl transition-transform duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0 open" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 pt-5 pb-4">
          <Link
            href="/"
            onClick={onMobileClose}
            className="flex items-center gap-3 font-semibold text-sm text-sidebar-fg"
          >
            <Monitor className="h-5 w-5 shrink-0 text-sidebar-active-bg" />
            <span>{branchLabel} Support</span>
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded p-1 text-sidebar-muted hover:text-sidebar-fg"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 px-4 pb-3">
          <RoleBadgePill role={role} />
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto px-3">
          <NavLinks pathname={pathname} collapsed={false} onLinkClick={onMobileClose} />
        </nav>
        <div className="border-t border-white/10 px-3 pt-3 mt-auto shrink-0">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
                  isActive
                    ? "bg-sidebar-active-bg font-medium text-sidebar-active-fg"
                    : "text-sidebar-muted hover:bg-sidebar-hover-bg hover:text-sidebar-fg"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
        {user && (
          <div className="border-t border-white/10 px-3 py-3 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-sidebar-fg">
              {user.email?.slice(0, 2).toUpperCase() ?? "?"}
            </div>
            <span className="truncate text-xs text-sidebar-muted">
              {user.email}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
