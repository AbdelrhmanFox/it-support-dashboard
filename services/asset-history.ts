/**
 * Asset history (maintenance log) via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["asset_history"]["Row"];
type Insert = Database["public"]["Tables"]["asset_history"]["Insert"];

export type AssetHistoryEntry = Row & {
  spare_parts?: { part_name: string } | null;
};

export async function getAssetHistory(params?: {
  assetId?: string;
  limit?: number;
}): Promise<AssetHistoryEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from("asset_history")
    .select("*, spare_parts(part_name)")
    .order("performed_at", { ascending: false });
  if (params?.assetId) query = query.eq("asset_id", params.assetId);
  if (params?.limit) query = query.limit(params.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AssetHistoryEntry[];
}

export async function createAssetHistoryEntry(
  input: Omit<Insert, "id" | "created_at">
): Promise<AssetHistoryEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("asset_history")
    .insert(input)
    .select("*, spare_parts(part_name)")
    .single();
  if (error) throw error;
  return data as AssetHistoryEntry;
}
