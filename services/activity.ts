/**
 * Recent activity items for dashboard feed.
 */
import { createClient } from "@/lib/supabase/client";

export type ActivityType = "ticket" | "purchase_request" | "stock" | "asset_history";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  link?: string;
}

export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
  const supabase = createClient();

  const [ticketsRes, prRes, stockRes] = await Promise.all([
    supabase.from("tickets").select("id, ticket_number, requester_name, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("purchase_requests").select("id, request_number, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("stock_transactions").select("id, transaction_type, quantity, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const items: ActivityItem[] = [];

  (ticketsRes.data || []).forEach((t) => {
    items.push({
      id: t.id,
      type: "ticket",
      title: `Ticket #${(t as { ticket_number?: string }).ticket_number}`,
      description: `${(t as { requester_name?: string }).requester_name} — ${(t as { status?: string }).status}`,
      date: (t as { created_at: string }).created_at,
      link: `/tickets/${t.id}`,
    });
  });
  (prRes.data || []).forEach((r) => {
    items.push({
      id: r.id,
      type: "purchase_request",
      title: `PR ${(r as { request_number?: string }).request_number}`,
      description: `Status: ${(r as { status?: string }).status}`,
      date: (r as { created_at: string }).created_at,
      link: `/purchase-requests/${r.id}`,
    });
  });
  (stockRes.data || []).forEach((s) => {
    const t = s as { transaction_type: string; quantity: number; created_at: string };
    items.push({
      id: s.id,
      type: "stock",
      title: `Stock ${t.transaction_type}`,
      description: `Quantity: ${t.quantity}`,
      date: t.created_at,
    });
  });

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, limit);
}
