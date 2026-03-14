/**
 * Stock transactions and inventory queries via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { getSparePartById, updateSparePart } from "@/services/spare-parts";
import { getAssetById } from "@/services/assets";
import { createAssetHistoryEntry, getAssetHistory, deleteAssetHistoryEntry } from "@/services/asset-history";

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

/**
 * Use a spare part on a specific asset:
 * - Creates an OUT stock transaction
 * - Decrements spare_parts.current_stock
 * - Logs an entry into asset_history
 */
export async function useSparePartOnAsset(params: {
  sparePartId: string;
  assetId: string;
  quantity?: number;
  branchId?: string | null;
  performedById?: string | null;
}): Promise<StockTransaction> {
  const { sparePartId, assetId, quantity = 1, branchId, performedById } = params;

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  const [part, asset] = await Promise.all([
    getSparePartById(sparePartId),
    getAssetById(assetId),
  ]);
  if (!part) {
    throw new Error("Spare part not found.");
  }
  if (!asset) {
    throw new Error("Asset not found.");
  }

  if (part.current_stock < quantity) {
    throw new Error("Not enough stock available for this spare part.");
  }

  // Use asset's branch so history shows under Asset History when filtering by that branch
  const effectiveBranchId = asset.branch_id ?? branchId ?? part.branch_id ?? null;

  // 1) Create OUT stock transaction
  const tx = await createStockTransaction({
    spare_part_id: sparePartId,
    transaction_type: "OUT",
    quantity,
    transaction_date: new Date().toISOString(),
    related_asset_id: assetId,
    performed_by_id: performedById ?? null,
    notes: null,
    branch_id: effectiveBranchId,
  });

  // 2) Update current_stock on spare_parts
  await updateSparePart(sparePartId, {
    current_stock: part.current_stock - quantity,
  });

  // 3) Log into asset_history
  await createAssetHistoryEntry({
    asset_id: assetId,
    action_type: "SPARE_PART_USED",
    description: `Used ${quantity} × ${part.part_name} from stock`,
    installed_part_id: sparePartId,
    old_value: null,
    new_value: null,
    performed_by_id: performedById ?? null,
    performed_at: new Date().toISOString(),
    branch_id: effectiveBranchId,
  });

  return tx;
}

/**
 * Reverse a "use spare part on asset" (undo mistaken use).
 * - Creates an IN transaction to put quantity back
 * - Restores spare_parts.current_stock
 * - Removes the corresponding asset_history SPARE_PART_USED entry
 */
export async function reverseUseSparePartOnAsset(stockTransactionId: string): Promise<void> {
  const supabase = createClient();
  const { data: tx, error: fetchErr } = await supabase
    .from("stock_transactions")
    .select("*")
    .eq("id", stockTransactionId)
    .single();
  if (fetchErr || !tx) {
    throw new Error("Stock transaction not found.");
  }
  if (tx.transaction_type !== "OUT" || !tx.related_asset_id) {
    throw new Error("This transaction is not a 'use on asset' and cannot be reversed here.");
  }

  const part = await getSparePartById(tx.spare_part_id);
  if (!part) {
    throw new Error("Spare part not found.");
  }

  const quantity = tx.quantity;
  const assetId = tx.related_asset_id;
  const sparePartId = tx.spare_part_id;
  const branchId = tx.branch_id;

  // 1) Create IN transaction (reversal)
  await createStockTransaction({
    spare_part_id: sparePartId,
    transaction_type: "IN",
    quantity,
    transaction_date: new Date().toISOString(),
    related_asset_id: null,
    performed_by_id: tx.performed_by_id,
    notes: "Reversal of use on asset (mistaken entry)",
    branch_id: branchId,
  });

  // 2) Restore current_stock
  await updateSparePart(sparePartId, {
    current_stock: part.current_stock + quantity,
  });

  // 3) Remove the asset_history entry for this use (match by asset, part, type, and time)
  const history = await getAssetHistory({
    assetId,
    branchId: branchId ?? undefined,
    limit: 50,
  });
  const txTime = new Date(tx.transaction_date).getTime();
  const useEntry = history.find(
    (h) =>
      h.action_type === "SPARE_PART_USED" &&
      h.installed_part_id === sparePartId &&
      Math.abs(new Date(h.performed_at).getTime() - txTime) < 120_000
  );
  if (useEntry) {
    await deleteAssetHistoryEntry(useEntry.id);
  }

  // 4) Delete the original OUT transaction so it doesn't double-count
  await deleteStockTransaction(stockTransactionId);
}
