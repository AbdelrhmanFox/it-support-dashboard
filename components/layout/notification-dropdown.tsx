"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications } from "@/services/notifications";
import type { Notification } from "@/services/notifications";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      getNotifications({ unreadOnly: false, limit: 8 })
        .then(setItems)
        .catch(() => setItems([]));
    }
  }, [open]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px]">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-semibold">Notifications</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </Button>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={n.related_record_id && n.module ? `/${n.module}/${n.related_record_id}` : "/notifications"}
                onClick={() => setOpen(false)}
              >
                <div
                  className={cn(
                    "border-b px-3 py-3 text-sm transition-colors hover:bg-muted/50",
                    !n.read_at && "bg-primary/5"
                  )}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.message && (
                    <p className="mt-0.5 line-clamp-2 text-muted-foreground">{n.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
