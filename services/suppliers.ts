/**
 * Suppliers CRUD and queries via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierInsert = Database["public"]["Tables"]["suppliers"]["Insert"];
type SupplierUpdate = Database["public"]["Tables"]["suppliers"]["Update"];

export type Supplier = SupplierRow;

export async function getSuppliers(params?: { search?: string; branchId?: string | null }): Promise<Supplier[]> {
  const supabase = createClient();
  let query = supabase.from("suppliers").select("*").order("name");
  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%,email.ilike.%${params.search}%`
    );
  }
  if (params?.branchId != null) query = query.eq("branch_id", params.branchId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createSupplier(
  input: Omit<SupplierInsert, "id" | "created_at" | "updated_at">
): Promise<Supplier> {
  const supabase = createClient();
  const { data, error } = await supabase.from("suppliers").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, input: SupplierUpdate): Promise<Supplier> {
  const supabase = createClient();
  const { data, error } = await supabase.from("suppliers").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}
