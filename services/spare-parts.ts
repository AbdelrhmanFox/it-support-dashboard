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
