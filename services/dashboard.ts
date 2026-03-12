/**
 * Dashboard aggregates: counts and chart data.
 * Used by the main dashboard page.
 */
import { createClient } from "@/lib/supabase/client";

export interface DashboardCounts {
  openTickets: number;
  lowStockItems: number;
  delayedSuppliers: number;
  pendingRequests: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = createClient();

  const [ticketsRes, requestsRes] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).in("status", ["draft", "submitted", "ordered", "waiting_supplier"]),
  ]);

  // Low stock: current_stock <= reorder_level — we need to fetch and filter in JS
  const { data: parts } = await supabase.from("spare_parts").select("id, current_stock, reorder_level");
  const lowStockItems = (parts || []).filter((p) => p.current_stock <= p.reorder_level).length;

  // Delayed: purchase_requests where expected_delivery_date < today and status not delivered/cancelled
  const today = new Date().toISOString().slice(0, 10);
  const { data: delayed } = await supabase
    .from("purchase_requests")
    .select("id")
    .lt("expected_delivery_date", today)
    .not("status", "in", '("delivered","cancelled")');

  return {
    openTickets: ticketsRes.count ?? 0,
    lowStockItems,
    delayedSuppliers: delayed?.length ?? 0,
    pendingRequests: requestsRes.count ?? 0,
  };
}

export interface TicketsPerMonthItem {
  month: string;
  count: number;
}

export async function getTicketsPerMonth(months: number = 6): Promise<TicketsPerMonthItem[]> {
  const supabase = createClient();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const { data } = await supabase
    .from("tickets")
    .select("created_at")
    .gte("created_at", start.toISOString());

  const byMonth: Record<string, number> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = 0;
  }
  (data || []).forEach((t) => {
    const created = t.created_at as string;
    const key = created.slice(0, 7);
    if (byMonth[key] !== undefined) byMonth[key]++;
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export interface InventoryStatusItem {
  name: string;
  count: number;
  fill: string;
}

export async function getInventoryStatus(): Promise<InventoryStatusItem[]> {
  const supabase = createClient();
  const { data } = await supabase.from("spare_parts").select("part_name, current_stock, reorder_level");
  const list = data || [];
  let ok = 0;
  let low = 0;
  let out = 0;
  list.forEach((p) => {
    if (p.current_stock <= 0) out++;
    else if (p.current_stock <= p.reorder_level) low++;
    else ok++;
  });
  return [
    { name: "OK", count: ok, fill: "hsl(var(--primary))" },
    { name: "Low stock", count: low, fill: "hsl(38 92% 50%)" },
    { name: "Out of stock", count: out, fill: "hsl(var(--destructive))" },
  ].filter((x) => x.count > 0);
}
