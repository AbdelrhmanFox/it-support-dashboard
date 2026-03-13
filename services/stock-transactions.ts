/**
 * Stock transactions and inventory queries via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["stock_transactions"]["Row"];
type Insert = Database["public"]["Tables"]["stock_transactions"]["Insert"];

export type StockTransaction = Row & {
  spare_parts?: { part_name: string; sku: string | null } | null;
  assets?: { asset_tag: string } | null;
};

export async function getStockTransactions(params?: {
  partId?: string;
  assetId?: string;
  limit?: number;
  branchId?: string | null;
}): Promise<StockTransaction[]> {
  const supabase = createClient();
  let query = supabase
    .from("stock_transactions")
    .select("*, spare_parts(part_name, sku), assets(asset_tag)")
    .order("transaction_date", { ascending: false });
  if (params?.partId) query = query.eq("spare_part_id", params.partId);
  if (params?.assetId) query = query.eq("related_asset_id", params.assetId);
  if (params?.branchId != null) query = query.eq("branch_id", params.branchId);
  if (params?.limit) query = query.limit(params.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as StockTransaction[];
}

export async function createStockTransaction(
  input: Omit<Insert, "id" | "created_at">
): Promise<StockTransaction> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stock_transactions")
    .insert(input)
    .select("*, spare_parts(part_name, sku), assets(asset_tag)")
    .single();
  if (error) throw error;
  return data as StockTransaction;
}

export async function deleteStockTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("stock_transactions").delete().eq("id", id);
  if (error) throw error;
}
