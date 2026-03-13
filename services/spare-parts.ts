/**
 * Spare parts CRUD and queries via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type SparePartRow = Database["public"]["Tables"]["spare_parts"]["Row"];
type SparePartInsert = Database["public"]["Tables"]["spare_parts"]["Insert"];
type SparePartUpdate = Database["public"]["Tables"]["spare_parts"]["Update"];

export type SparePart = SparePartRow & { suppliers?: { name: string } | null };

export async function getSpareParts(params?: {
  category?: string;
  supplierId?: string;
  search?: string;
  lowStockOnly?: boolean;
  branchId?: string | null;
}): Promise<SparePart[]> {
  const supabase = createClient();
  let query = supabase
    .from("spare_parts")
    .select("*, suppliers(name)")
    .order("part_name");

  if (params?.category) {
    query = query.eq("category", params.category);
  }
  if (params?.supplierId) {
    query = query.eq("supplier_id", params.supplierId);
  }
  if (params?.search) {
    query = query.or(
      `part_name.ilike.%${params.search}%,sku.ilike.%${params.search}%,brand.ilike.%${params.search}%`
    );
  }
  if (params?.branchId != null) query = query.eq("branch_id", params.branchId);

  const { data, error } = await query;
  if (error) throw error;
  const list = (data || []) as SparePart[];
  if (params?.lowStockOnly) {
    return list.filter((p) => p.current_stock <= p.reorder_level);
  }
  return list;
}

export async function getSparePartById(id: string): Promise<SparePart | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spare_parts")
    .select("*, suppliers(name)")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as SparePart;
}

export async function createSparePart(
  input: Omit<SparePartInsert, "id" | "created_at" | "updated_at">
): Promise<SparePart> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spare_parts")
    .insert(input)
    .select("*, suppliers(name)")
    .single();
  if (error) throw error;
  return data as SparePart;
}

export async function updateSparePart(
  id: string,
  input: SparePartUpdate
): Promise<SparePart> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spare_parts")
    .update(input)
    .eq("id", id)
    .select("*, suppliers(name)")
    .single();
  if (error) throw error;
  return data as SparePart;
}

export async function deleteSparePart(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("spare_parts").delete().eq("id", id);
  if (error) throw error;
}

/** True if error is PostgREST "table not in schema cache" (migration not applied). */
function isSparePartAssetsTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205") return true;
  const msg = error.message ?? "";
  return msg.includes("spare_part_assets") && (msg.includes("schema cache") || msg.includes("Could not find"));
}

/** Get asset IDs linked to a spare part (which assets this part can be used for). */
export async function getLinkedAssetIdsForSparePart(sparePartId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spare_part_assets")
    .select("asset_id")
    .eq("spare_part_id", sparePartId);
  if (error) {
    if (isSparePartAssetsTableMissing(error)) return [];
    throw error;
  }
  return (data ?? []).map((r) => r.asset_id);
}

/** Get full asset rows linked to a spare part. */
export async function getLinkedAssetsForSparePart(
  sparePartId: string
): Promise<Array<{ id: string; asset_tag: string; serial_number: string | null; device_type: string }>> {
  const ids = await getLinkedAssetIdsForSparePart(sparePartId);
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, asset_tag, serial_number, device_type")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; asset_tag: string; serial_number: string | null; device_type: string }>;
}

/** Set which assets a spare part can be used for. Replaces existing links.
 * If table spare_part_assets does not exist yet (migration not run), no-ops so spare part create/update still succeeds. */
export async function setLinkedAssetsForSparePart(
  sparePartId: string,
  assetIds: string[]
): Promise<void> {
  const supabase = createClient();
  const { error: delErr } = await supabase
    .from("spare_part_assets")
    .delete()
    .eq("spare_part_id", sparePartId);
  if (delErr) {
    if (isSparePartAssetsTableMissing(delErr)) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && assetIds.length > 0) {
        console.warn(
          "spare_part_assets table missing — run database/migrations/add-spare-part-assets.sql in Supabase. Device asset links not saved."
        );
      }
      return;
    }
    throw delErr;
  }
  if (assetIds.length === 0) return;
  const rows = assetIds.map((asset_id) => ({ spare_part_id: sparePartId, asset_id }));
  const { error: insErr } = await supabase.from("spare_part_assets").insert(rows);
  if (insErr) {
    if (isSparePartAssetsTableMissing(insErr)) return;
    throw insErr;
  }
}
