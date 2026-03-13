"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/components/branch-provider";

export function BranchSwitcher() {
  const { branches, selectedBranchId, setSelectedBranchId, role } = useBranch();

  // Only admins see the branch switcher; support/viewer and loading (role null) never see it
  if (role !== "admin" || branches.length === 0) return null;

  return (
    <Select
      value={selectedBranchId ?? "__all__"}
      onValueChange={(v) => setSelectedBranchId(v === "__all__" ? null : v)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Branch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All Branches</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
