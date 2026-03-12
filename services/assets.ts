/**
 * IT Assets CRUD via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["assets"]["Row"];
type Insert = Database["public"]["Tables"]["assets"]["Insert"];
type Update = Database["public"]["Tables"]["assets"]["Update"];

export type Asset = Row;

const statuses = ["active", "in_maintenance", "retired", "lost", "spare"] as const;
export type AssetStatus = (typeof statuses)[number];

export async function getAssets(params?: {
  status?: string;
  search?: string;
  department?: string;
}): Promise<Asset[]> {
  const supabase = createClient();
  let query = supabase.from("assets").select("*").order("asset_tag");
  if (params?.status) query = query.eq("status", params.status);
  if (params?.department) query = query.eq("department", params.department);
  if (params?.search) {
    query = query.or(
      `asset_tag.ilike.%${params.search}%,serial_number.ilike.%${params.search}%,assigned_user_name.ilike.%${params.search}%`
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAssetById(id: string): Promise<Asset | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createAsset(
  input: Omit<Insert, "id" | "created_at" | "updated_at">
): Promise<Asset> {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateAsset(id: string, input: Update): Promise<Asset> {
  const supabase = createClient();
  const { data, error } = await supabase.from("assets").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAsset(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw error;
}
