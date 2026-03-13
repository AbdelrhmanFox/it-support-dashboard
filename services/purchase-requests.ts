/**
 * Purchase requests CRUD via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["purchase_requests"]["Row"];
type Insert = Database["public"]["Tables"]["purchase_requests"]["Insert"];
type Update = Database["public"]["Tables"]["purchase_requests"]["Update"];

export type PurchaseRequest = Row & {
  spare_parts?: { part_name: string; sku: string | null } | null;
  suppliers?: { name: string } | null;
};

const statuses = ["draft", "submitted", "ordered", "waiting_supplier", "delivered", "cancelled"] as const;
export type PurchaseRequestStatus = (typeof statuses)[number];

export async function getPurchaseRequests(params?: {
  status?: string;
  supplierId?: string;
  branchId?: string | null;
}): Promise<PurchaseRequest[]> {
  const supabase = createClient();
  let query = supabase
    .from("purchase_requests")
    .select("*, spare_parts(part_name, sku), suppliers(name)")
    .order("request_date", { ascending: false });
  if (params?.status) query = query.eq("status", params.status);
  if (params?.supplierId) query = query.eq("supplier_id", params.supplierId);
  if (params?.branchId != null) query = query.eq("branch_id", params.branchId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PurchaseRequest[];
}

export async function getPurchaseRequestById(id: string): Promise<PurchaseRequest | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*, spare_parts(part_name, sku), suppliers(name)")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as PurchaseRequest;
}

export async function createPurchaseRequest(
  input: Omit<Insert, "id" | "created_at" | "updated_at"> & { request_number: string }
): Promise<PurchaseRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .insert(input)
    .select("*, spare_parts(part_name, sku), suppliers(name)")
    .single();
  if (error) throw error;
  return data as PurchaseRequest;
}

export async function updatePurchaseRequest(id: string, input: Update): Promise<PurchaseRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .update(input)
    .eq("id", id)
    .select("*, spare_parts(part_name, sku), suppliers(name)")
    .single();
  if (error) throw error;
  return data as PurchaseRequest;
}

/** Generate next request number (e.g. PR-20250312-0001). */
export function generateRequestNumber(): string {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  return `PR-${ymd}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
}
