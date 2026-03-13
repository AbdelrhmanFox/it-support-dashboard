"use client";

import { Badge } from "@/components/ui/badge";
import { useBranch, type UserRole } from "@/components/branch-provider";
import { cn } from "@/lib/utils";

const roleConfig: Record<
  NonNullable<UserRole>,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  admin: {
    label: "Admin",
    variant: "default",
    className: "bg-primary text-primary-foreground",
  },
  support: {
    label: "Support",
    variant: "secondary",
    className: "bg-blue-600/90 text-white border-0",
  },
  viewer: {
    label: "Viewer",
    variant: "outline",
    className: "text-muted-foreground",
  },
};

interface RoleBadgeProps {
  className?: string;
  showLabel?: boolean;
}

/** Shows current user role (Admin / Support / Viewer). Use in top bar or sidebar. */
export function RoleBadge({ className, showLabel = true }: RoleBadgeProps) {
  const { role } = useBranch();
  if (!role) return null;
  const config = roleConfig[role];
  if (!config) return null;
  return (
    <Badge
      variant={config.variant}
      className={cn("font-medium", config.className, className)}
      title={`Role: ${config.label}`}
    >
      {showLabel ? config.label : null}
    </Badge>
  );
}
