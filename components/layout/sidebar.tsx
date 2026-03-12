"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Spare Parts", href: "/spare-parts", icon: Package },
  { title: "Inventory", href: "/inventory", icon: Warehouse },
  { title: "Purchase Requests", href: "/purchase-requests", icon: FileText },
  { title: "Suppliers", href: "/suppliers", icon: Truck },
  { title: "Assets", href: "/assets", icon: Monitor },
  { title: "Asset History", href: "/asset-history", icon: History },
  { title: "Tickets", href: "/tickets", icon: Ticket },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Reports", href: "/reports", icon: BarChart3 },
];

const bottomNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ pathname, onLinkClick }: { pathname: string; onLinkClick?: () => void }) {
  return (
    <>
      {mainNav.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onLinkClick}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Button>
          </Link>
        );
      })}
      <Separator className="my-2" />
      {bottomNav.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onLinkClick}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Button>
          </Link>
        );
      })}
    </>
  );
}

interface SidebarProps {
  /** When true, show mobile overlay and drawer (mobile only) */
  mobileOpen?: boolean;
  /** Callback to close mobile sidebar (e.g. after navigation or backdrop click) */
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar: hidden on small screens */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Monitor className="h-6 w-6 text-primary" />
            <span className="text-lg">IT Support</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      {/* Mobile: overlay when menu is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          onKeyDown={(e) => e.key === "Escape" && onMobileClose?.()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {/* Mobile: slide-in sidebar drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-card shadow-xl transition-transform duration-200 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onMobileClose}>
            <Monitor className="h-6 w-6 text-primary" />
            <span className="text-lg">IT Support</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <NavLinks pathname={pathname} onLinkClick={onMobileClose} />
        </nav>
      </aside>
    </>
  );
}
