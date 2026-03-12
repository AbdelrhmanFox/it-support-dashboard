"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Main dashboard layout: sidebar (desktop) + top bar + content area.
 * Supports RTL and responsive behavior.
 */
export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <TopBar title={title} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
