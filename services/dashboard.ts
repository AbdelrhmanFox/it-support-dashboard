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
  devicesRequiringMaintenance: number;
  partsInstalledToday: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [ticketsRes, requestsRes, partsRes, delayedRes, assetsMaintenanceRes, partsTodayRes] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).in("status", ["draft", "submitted", "ordered", "waiting_supplier"]),
    supabase.from("spare_parts").select("id, current_stock, reorder_level"),
    supabase.from("purchase_requests").select("id").lt("expected_delivery_date", today).not("status", "in", '("delivered","cancelled")'),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("status", "in_maintenance"),
    supabase.from("stock_transactions").select("id").eq("transaction_type", "OUT").gte("transaction_date", todayStart.toISOString()).lt("transaction_date", todayEnd.toISOString()),
  ]);

  const lowStockItems = (partsRes.data || []).filter((p: { current_stock: number; reorder_level: number }) => p.current_stock <= p.reorder_level).length;

  return {
    openTickets: ticketsRes.count ?? 0,
    lowStockItems,
    delayedSuppliers: delayedRes.data?.length ?? 0,
    pendingRequests: requestsRes.count ?? 0,
    devicesRequiringMaintenance: assetsMaintenanceRes.count ?? 0,
    partsInstalledToday: partsTodayRes.data?.length ?? 0,
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

export interface IssueTypeCount {
  issue_type: string;
  count: number;
}

export async function getMostCommonIssues(limit = 6): Promise<IssueTypeCount[]> {
  const supabase = createClient();
  const { data } = await supabase.from("tickets").select("issue_type");
  const list = data || [];
  const byType: Record<string, number> = {};
  list.forEach((t: { issue_type: string | null }) => {
    const key = t.issue_type || "Other";
    byType[key] = (byType[key] || 0) + 1;
  });
  return Object.entries(byType)
    .map(([issue_type, count]) => ({ issue_type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface PartsConsumptionItem {
  month: string;
  count: number;
}

export async function getPartsConsumptionByMonth(months = 6): Promise<PartsConsumptionItem[]> {
  const supabase = createClient();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const { data } = await supabase
    .from("stock_transactions")
    .select("transaction_date, quantity")
    .eq("transaction_type", "OUT")
    .gte("transaction_date", start.toISOString());
  const byMonth: Record<string, number> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = 0;
  }
  (data || []).forEach((t: { transaction_date: string; quantity: number }) => {
    const key = t.transaction_date.slice(0, 7);
    if (byMonth[key] !== undefined) byMonth[key] += t.quantity || 0;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export interface SupplierDelaysItem {
  month: string;
  count: number;
}

export async function getSupplierDelaysByMonth(months = 6): Promise<SupplierDelaysItem[]> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("purchase_requests")
    .select("expected_delivery_date")
    .lt("expected_delivery_date", today)
    .not("status", "in", '("delivered","cancelled")');
  const byMonth: Record<string, number> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = 0;
  }
  (data || []).forEach((r: { expected_delivery_date: string | null }) => {
    if (!r.expected_delivery_date) return;
    const key = r.expected_delivery_date.slice(0, 7);
    if (byMonth[key] !== undefined) byMonth[key]++;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export interface MaintenanceStatsItem {
  month: string;
  count: number;
}

export async function getMaintenanceStatsByMonth(months = 6): Promise<MaintenanceStatsItem[]> {
  const supabase = createClient();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const { data } = await supabase
    .from("asset_history")
    .select("performed_at")
    .gte("performed_at", start.toISOString());
  const byMonth: Record<string, number> = {};
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = 0;
  }
  (data || []).forEach((h: { performed_at: string }) => {
    const key = h.performed_at.slice(0, 7);
    if (byMonth[key] !== undefined) byMonth[key]++;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}
