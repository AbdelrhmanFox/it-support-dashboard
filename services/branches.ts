/**
 * Branches (factories) for multi-branch support.
 */
import { createClient } from "@/lib/supabase/client";

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string | null;
  created_at: string;
}

export async function getBranches(): Promise<Branch[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .order("code");
  if (error) throw error;
  return (data || []) as Branch[];
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("branches").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Branch;
}
