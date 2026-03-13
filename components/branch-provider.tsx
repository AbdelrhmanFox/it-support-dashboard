"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
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
  /** Can create/edit/delete (admin and support; viewer is read-only) */
  canEdit: boolean;
  /** Display label for current branch filter */
  branchLabel: string;
  loading: boolean;
}

const BranchContext = React.createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "it-support-selected-branch-id";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [authUserId, setAuthUserId] = React.useState<string | null>(null);
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

  // Refetch profile when auth user changes (login/logout/switch user)
  const [authChecked, setAuthChecked] = React.useState(false);
  React.useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUserId(user?.id ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    setLoading(true);
    if (!authUserId) {
      setProfile(null);
      setBranches([]);
      setLoading(false);
      return;
    }
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
  }, [authUserId]);

  const role = (profile?.role as UserRole) ?? null;
  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "support";
  const userBranchId = profile?.branch_id ?? null;

  const effectiveBranchId = isAdmin ? selectedBranchId : userBranchId;

  const branchLabel = (() => {
    if (effectiveBranchId) {
      const b = branches.find((x) => x.id === effectiveBranchId);
      return b ? b.name : "Branch";
    }
    // "All Branches" only for admin; support/viewer never see it
    if (isAdmin) return "All Branches";
    return "IT"; // support/viewer with no branch: header shows "IT Support"
  })();

  const value: BranchContextValue = {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    effectiveBranchId,
    userBranchId,
    role,
    isAdmin,
    canEdit,
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
      isAdmin: false,
      canEdit: false,
      branchLabel: "Support",
      loading: false,
    };
  }
  return ctx;
}
