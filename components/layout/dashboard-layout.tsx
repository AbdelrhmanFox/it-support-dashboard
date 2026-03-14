"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import type { TopBarBreadcrumb } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

function getSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: TopBarBreadcrumb;
}

/**
 * Main dashboard layout: sidebar (desktop) + top bar + content area.
 * Supports RTL and responsive behavior.
 */
export function DashboardLayout({ children, title, breadcrumb }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(getSidebarCollapsed());
    const onToggle = (e: CustomEvent<{ collapsed: boolean }>) => setSidebarCollapsed(e.detail.collapsed);
    const onStorage = () => setSidebarCollapsed(getSidebarCollapsed());
    window.addEventListener("sidebar-toggle", onToggle as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sidebar-toggle", onToggle as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div
        className={cn(
          "transition-[padding] duration-200 ease-in-out",
          sidebarCollapsed ? "lg:pl-sidebar-collapsed" : "lg:pl-sidebar"
        )}
      >
        <TopBar title={title} breadcrumb={breadcrumb} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main id="main-content" className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
