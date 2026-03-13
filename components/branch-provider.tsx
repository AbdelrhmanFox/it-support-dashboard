"use client";

import * as React from "react";
import { getBranches, type Branch } from "@/services/branches";
import { getCurrentUserProfile } from "@/services/profile";

export type UserRole = "admin" | "support" | "viewer";

interface BranchContextValue {
  branches: Branch[];
  /** Admin-selected filter: null = all branches */
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  /** Effective branch for queries: null means "all" (admin only) */
  effectiveBranchId: string | null;
  /** Current user's branch (for support/viewer) */
  userBranchId: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  /** Display label for current branch filter */
  branchLabel: string;
  loading: boolean;
}

const BranchContext = React.createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "it-support-selected-branch-id";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [profile, setProfile] = React.useState<Awaited<ReturnType<typeof getCurrentUserProfile>>>(null);
  const [selectedBranchId, setSelectedBranchIdState] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const setSelectedBranchId = React.useCallback((id: string | null) => {
    setSelectedBranchIdState(id);
    if (typeof localStorage !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [branchList, prof] = await Promise.all([
          getBranches(),
          getCurrentUserProfile(),
        ]);
        if (cancelled) return;
        setBranches(branchList);
        setProfile(prof);
        if (prof?.role === "admin") {
          const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
          setSelectedBranchIdState(stored || null);
        } else if (prof?.branch_id) {
          setSelectedBranchIdState(prof.branch_id);
        }
      } catch {
        if (!cancelled) setBranches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const role = (profile?.role as UserRole) ?? null;
  const isAdmin = role === "admin";
  const userBranchId = profile?.branch_id ?? null;

  const effectiveBranchId = isAdmin ? selectedBranchId : userBranchId;

  const branchLabel = (() => {
    if (effectiveBranchId) {
      const b = branches.find((x) => x.id === effectiveBranchId);
      return b ? b.name : "Branch";
    }
    return "All Branches";
  })();

  const value: BranchContextValue = {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    effectiveBranchId,
    userBranchId,
    role,
    isAdmin,
    branchLabel,
    loading,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = React.useContext(BranchContext);
  if (!ctx) {
    return {
      branches: [],
      selectedBranchId: null,
      setSelectedBranchId: () => {},
      effectiveBranchId: null,
      userBranchId: null,
      role: null,
      isAdmin: true,
      branchLabel: "All Branches",
      loading: false,
    };
  }
  return ctx;
}
