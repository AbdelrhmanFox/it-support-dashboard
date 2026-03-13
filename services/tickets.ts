/**
 * Tickets CRUD via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["tickets"]["Row"];
type Insert = Database["public"]["Tables"]["tickets"]["Insert"];
type Update = Database["public"]["Tables"]["tickets"]["Update"];

export type Ticket = Row;

const statuses = ["open", "in_progress", "waiting_user", "resolved", "closed"] as const;
export type TicketStatus = (typeof statuses)[number];

export async function getTickets(params?: { status?: string; assetId?: string; branchId?: string | null }): Promise<Ticket[]> {
  const supabase = createClient();
  let query = supabase.from("tickets").select("*").order("created_at", { ascending: false });
  if (params?.status) query = query.eq("status", params.status);
  if (params?.assetId) query = query.eq("asset_id", params.assetId);
  if (params?.branchId != null) query = query.eq("branch_id", params.branchId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tickets").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createTicket(
  input: Omit<Insert, "id" | "created_at" | "updated_at"> & { ticket_number: string }
): Promise<Ticket> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tickets").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTicket(id: string, input: Update): Promise<Ticket> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tickets").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export function generateTicketNumber(): string {
  return `TKT-${Date.now()}`;
}
