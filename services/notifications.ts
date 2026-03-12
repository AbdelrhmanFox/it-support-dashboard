/**
 * Notifications CRUD via Supabase.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["notifications"]["Row"];
type Insert = Database["public"]["Tables"]["notifications"]["Insert"];
type Update = Database["public"]["Tables"]["notifications"]["Update"];

export type Notification = Row;

export async function getNotifications(params?: {
  userId?: string | null;
  unreadOnly?: boolean;
  limit?: number;
}): Promise<Notification[]> {
  const supabase = createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (params?.userId) query = query.eq("user_id", params.userId);
  if (params?.unreadOnly) query = query.is("read_at", null);
  if (params?.limit) query = query.limit(params.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function markAsRead(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function createNotification(
  input: Omit<Insert, "id" | "created_at">
): Promise<Notification> {
  const supabase = createClient();
  const { data, error } = await supabase.from("notifications").insert(input).select().single();
  if (error) throw error;
  return data;
}
