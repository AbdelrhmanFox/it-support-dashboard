"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  LifeBuoy,
} from "lucide-react";

const pages: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "IT Support Request (public)", href: "/support", icon: LifeBuoy },
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => {
            const Icon = p.icon;
            return (
              <CommandItem
                key={p.href}
                onSelect={() => {
                  setOpen(false);
                  router.push(p.href);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {p.title}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
