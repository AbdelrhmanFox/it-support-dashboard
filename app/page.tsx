"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GripVertical, Pencil, Check } from "lucide-react";
import {
  getDashboardCounts,
  getTicketsPerMonth,
  getInventoryStatus,
  getMostCommonIssues,
  getPartsConsumptionByMonth,
  getMaintenanceStatsByMonth,
  type DashboardCounts as CountsType,
  type TicketsPerMonthItem,
  type InventoryStatusItem,
  type IssueTypeCount,
  type PartsConsumptionItem,
  type MaintenanceStatsItem,
} from "@/services/dashboard";
import { getRecentActivity, type ActivityItem } from "@/services/activity";
import { useBranch } from "@/components/branch-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const KPI_CARD_IDS = [
  "openTickets",
  "lowStock",
  "delayedSuppliers",
  "pendingRequests",
  "devicesMaintenance",
  "partsInstalledToday",
] as const;
const DASHBOARD_KPI_ORDER_KEY = "dashboard-kpi-cards-order";
const CHART_SECTION_IDS = [
  "ticketsPerMonth",
  "inventoryStatus",
  "mostCommonIssues",
  "partsConsumption",
  "deviceMaintenance",
  "recentActivity",
] as const;
const DASHBOARD_CHARTS_ORDER_KEY = "dashboard-charts-order";
const DASHBOARD_KPI_SIZES_KEY = "dashboard-kpi-sizes";
const DASHBOARD_CHARTS_SIZES_KEY = "dashboard-charts-sizes";

type CardSize = "s" | "m" | "l";

function getStoredKpiOrder(): string[] {
  if (typeof window === "undefined") return [...KPI_CARD_IDS];
  try {
    const raw = localStorage.getItem(DASHBOARD_KPI_ORDER_KEY);
    if (!raw) return [...KPI_CARD_IDS];
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((id) => KPI_CARD_IDS.includes(id as (typeof KPI_CARD_IDS)[number]));
    const missing = KPI_CARD_IDS.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...KPI_CARD_IDS];
  }
}

function getStoredChartsOrder(): string[] {
  if (typeof window === "undefined") return [...CHART_SECTION_IDS];
  try {
    const raw = localStorage.getItem(DASHBOARD_CHARTS_ORDER_KEY);
    if (!raw) return [...CHART_SECTION_IDS];
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((id) => CHART_SECTION_IDS.includes(id as (typeof CHART_SECTION_IDS)[number]));
    const missing = CHART_SECTION_IDS.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...CHART_SECTION_IDS];
  }
}

function getStoredSizes(key: string, validIds: readonly string[]): Record<string, CardSize> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const result: Record<string, CardSize> = {};
    for (const id of validIds) {
      const v = parsed[id];
      if (v === "s" || v === "m" || v === "l") result[id] = v;
    }
    return result;
  } catch {
    return {};
  }
}

export default function DashboardPage() {
  const { effectiveBranchId, role, branchLabel, isAdmin } = useBranch();
  const [kpiOrder, setKpiOrder] = useState<string[]>(() => getStoredKpiOrder());
  const [chartSectionOrder, setChartSectionOrder] = useState<string[]>(() => getStoredChartsOrder());
  const [kpiSizes, setKpiSizes] = useState<Record<string, CardSize>>(() =>
    getStoredSizes(DASHBOARD_KPI_SIZES_KEY, KPI_CARD_IDS)
  );
  const [chartSizes, setChartSizes] = useState<Record<string, CardSize>>(() =>
    getStoredSizes(DASHBOARD_CHARTS_SIZES_KEY, CHART_SECTION_IDS)
  );
  const [dashboardEditMode, setDashboardEditMode] = useState(false);
  const [counts, setCounts] = useState<CountsType | null>(null);
  const [ticketsPerMonth, setTicketsPerMonth] = useState<TicketsPerMonthItem[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatusItem[]>([]);
  const [mostCommonIssues, setMostCommonIssues] = useState<IssueTypeCount[]>([]);
  const [partsConsumption, setPartsConsumption] = useState<PartsConsumptionItem[]>([]);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStatsItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const timeout = setTimeout(() => {
        if (cancelled) return;
        setLoading(false);
        setDataError(true);
        setCounts((c) => c ?? { openTickets: 0, lowStockItems: 0, delayedSuppliers: 0, pendingRequests: 0, devicesRequiringMaintenance: 0, partsInstalledToday: 0 });
      }, 8000);

      try {
        const [c, tpm, inv, issues, consumption, maintenance, act] = await Promise.all([
          getDashboardCounts(effectiveBranchId ?? undefined),
          getTicketsPerMonth(6, effectiveBranchId ?? undefined),
          getInventoryStatus(effectiveBranchId ?? undefined),
          getMostCommonIssues(6, effectiveBranchId ?? undefined),
          getPartsConsumptionByMonth(6, effectiveBranchId ?? undefined),
          getMaintenanceStatsByMonth(6, effectiveBranchId ?? undefined),
          getRecentActivity(10, effectiveBranchId ?? undefined),
        ]);
        if (cancelled) return;
        setCounts(c);
        setTicketsPerMonth(tpm);
        setInventoryStatus(inv);
        setMostCommonIssues(issues);
        setPartsConsumption(consumption);
        setMaintenanceStats(maintenance);
        setActivity(act);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setDataError(true);
        setCounts({
          openTickets: 0,
          lowStockItems: 0,
          delayedSuppliers: 0,
          pendingRequests: 0,
          devicesRequiringMaintenance: 0,
          partsInstalledToday: 0,
        });
        setTicketsPerMonth([]);
        setInventoryStatus([]);
        setMostCommonIssues([]);
        setPartsConsumption([]);
        setMaintenanceStats([]);
        setActivity([]);
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [effectiveBranchId]);

  const saveKpiOrder = useCallback((order: string[]) => {
    setKpiOrder(order);
    if (typeof window !== "undefined") {
      localStorage.setItem(DASHBOARD_KPI_ORDER_KEY, JSON.stringify(order));
    }
  }, []);

  const [draggedKpiId, setDraggedKpiId] = useState<string | null>(null);
  const handleKpiDragStart = (id: string) => {
    setDraggedKpiId(id);
  };
  const handleKpiDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleKpiDrop = (targetId: string) => {
    setDraggedKpiId(null);
    if (!draggedKpiId || draggedKpiId === targetId) return;
    const newOrder = [...kpiOrder];
    const fromIdx = newOrder.indexOf(draggedKpiId);
    const toIdx = newOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedKpiId);
    saveKpiOrder(newOrder);
  };
  const handleKpiDragEnd = () => setDraggedKpiId(null);

  const saveChartsOrder = useCallback((order: string[]) => {
    setChartSectionOrder(order);
    if (typeof window !== "undefined") {
      localStorage.setItem(DASHBOARD_CHARTS_ORDER_KEY, JSON.stringify(order));
    }
  }, []);

  const saveKpiSize = useCallback((id: string, size: CardSize) => {
    setKpiSizes((prev) => {
      const next = { ...prev, [id]: size };
      if (typeof window !== "undefined") {
        localStorage.setItem(DASHBOARD_KPI_SIZES_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const saveChartSize = useCallback((id: string, size: CardSize) => {
    setChartSizes((prev) => {
      const next = { ...prev, [id]: size };
      if (typeof window !== "undefined") {
        localStorage.setItem(DASHBOARD_CHARTS_SIZES_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const getKpiSpan = useCallback(
    (id: string): 1 | 2 | 4 => {
      const size = kpiSizes[id] ?? "s";
      return size === "l" ? 4 : size === "m" ? 2 : 1;
    },
    [kpiSizes]
  );

  const getChartSpan = useCallback(
    (id: string): 1 | 2 | 3 => {
      const size = chartSizes[id] ?? "m";
      return size === "l" ? 3 : size === "m" ? 2 : 1;
    },
    [chartSizes]
  );

  const RESIZE_THRESHOLD_PX = 60;
  const [resizingCardId, setResizingCardId] = useState<string | null>(null);
  const [resizingType, setResizingType] = useState<"kpi" | "chart" | null>(null);
  const resizeRef = useRef({ startX: 0, startSpan: 1 });

  const spanToKpiSize = (span: number): CardSize =>
    span >= 4 ? "l" : span >= 2 ? "m" : "s";
  const spanToChartSize = (span: number): CardSize =>
    span >= 3 ? "l" : span >= 2 ? "m" : "s";

  const handleResizeStart = useCallback(
    (type: "kpi" | "chart", id: string, clientX: number, currentSpan: number) => {
      setResizingCardId(id);
      setResizingType(type);
      resizeRef.current = { startX: clientX, startSpan: currentSpan };
    },
    []
  );

  useEffect(() => {
    if (resizingCardId === null || resizingType === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeRef.current.startX;
      const kpiSteps: (1 | 2 | 4)[] = [1, 2, 4];
      const chartSteps: (1 | 2 | 3)[] = [1, 2, 3];
      if (deltaX > RESIZE_THRESHOLD_PX) {
        if (resizingType === "kpi") {
          const curr = resizeRef.current.startSpan as 1 | 2 | 4;
          const idx = kpiSteps.indexOf(curr);
          const next = kpiSteps[Math.min(kpiSteps.length - 1, idx + 1)];
          resizeRef.current = { startX: e.clientX, startSpan: next };
          setKpiSizes((prev) => ({ ...prev, [resizingCardId]: spanToKpiSize(next) }));
        } else {
          const curr = resizeRef.current.startSpan as 1 | 2 | 3;
          const idx = chartSteps.indexOf(curr);
          const next = chartSteps[Math.min(chartSteps.length - 1, idx + 1)];
          resizeRef.current = { startX: e.clientX, startSpan: next };
          setChartSizes((prev) => ({ ...prev, [resizingCardId]: spanToChartSize(next) }));
        }
      } else if (deltaX < -RESIZE_THRESHOLD_PX) {
        if (resizingType === "kpi") {
          const curr = resizeRef.current.startSpan as 1 | 2 | 4;
          const idx = kpiSteps.indexOf(curr);
          const next = kpiSteps[Math.max(0, idx - 1)];
          resizeRef.current = { startX: e.clientX, startSpan: next };
          setKpiSizes((prev) => ({ ...prev, [resizingCardId]: spanToKpiSize(next) }));
        } else {
          const curr = resizeRef.current.startSpan as 1 | 2 | 3;
          const idx = chartSteps.indexOf(curr);
          const next = chartSteps[Math.max(0, idx - 1)];
          resizeRef.current = { startX: e.clientX, startSpan: next };
          setChartSizes((prev) => ({ ...prev, [resizingCardId]: spanToChartSize(next) }));
        }
      }
    };

    const handleMouseUp = () => {
      const finalSpan = resizeRef.current.startSpan;
      if (resizingType === "kpi" && resizingCardId) {
        saveKpiSize(resizingCardId, spanToKpiSize(finalSpan as 1 | 2 | 4));
      } else if (resizingType === "chart" && resizingCardId) {
        saveChartSize(resizingCardId, spanToChartSize(finalSpan as 1 | 2 | 3));
      }
      setResizingCardId(null);
      setResizingType(null);
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [resizingCardId, resizingType, saveKpiSize, saveChartSize]);

  const [draggedChartId, setDraggedChartId] = useState<string | null>(null);
  const handleChartDragStart = (id: string) => setDraggedChartId(id);
  const handleChartDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleChartDrop = (targetId: string) => {
    setDraggedChartId(null);
    if (!draggedChartId || draggedChartId === targetId) return;
    const newOrder = [...chartSectionOrder];
    const fromIdx = newOrder.indexOf(draggedChartId);
    const toIdx = newOrder.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedChartId);
    saveChartsOrder(newOrder);
  };
  const handleChartDragEnd = () => setDraggedChartId(null);

  const getChartSectionContent = useCallback(
    (id: string): { title: string; description: string; content: ReactNode } => {
      switch (id) {
        case "ticketsPerMonth":
          return {
            title: "Tickets per month",
            description: "Support ticket trend (last 6 months)",
            content: (
              <div className="h-[300px]">
                {ticketsPerMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ticketsPerMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                    No ticket data yet
                  </div>
                )}
              </div>
            ),
          };
        case "inventoryStatus":
          return {
            title: "Inventory status",
            description: "Parts by stock level",
            content: (
              <div className="h-[300px]">
                {inventoryStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryStatus}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {inventoryStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                    No parts data yet
                  </div>
                )}
              </div>
            ),
          };
        case "mostCommonIssues":
          return {
            title: "Most common issues",
            description: "Tickets by issue type",
            content: (
              <div className="h-[260px]">
                {mostCommonIssues.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mostCommonIssues} layout="vertical" margin={{ left: 0 }}>
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="issue_type" width={100} className="text-xs" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                    No data yet
                  </div>
                )}
              </div>
            ),
          };
        case "partsConsumption":
          return {
            title: "Parts consumption",
            description: "OUT quantity per month (6 months)",
            content: (
              <div className="h-[260px]">
                {partsConsumption.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={partsConsumption}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                    No data yet
                  </div>
                )}
              </div>
            ),
          };
        case "deviceMaintenance":
          return {
            title: "Device maintenance",
            description: "History entries per month (6 months)",
            content: (
              <div className="h-[260px]">
                {maintenanceStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                    No data yet
                  </div>
                )}
              </div>
            ),
          };
        case "recentActivity":
          return {
            title: "Recent activity",
            description: "Latest tickets, purchase requests, and stock movements",
            content:
              activity.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                  No recent activity
                </div>
              ) : (
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.title}</span>
                        <span className="text-muted-foreground"> — {item.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {new Date(item.date).toLocaleString()}
                        </span>
                        {item.link && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={item.link}>View</Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ),
          };
        default:
          return { title: id, description: "", content: null };
      }
    },
    [
      ticketsPerMonth,
      inventoryStatus,
      mostCommonIssues,
      partsConsumption,
      maintenanceStats,
      activity,
    ]
  );

  const getKpiCardContent = useCallback(
    (id: string) => {
      const c = counts ?? {
        openTickets: 0,
        lowStockItems: 0,
        delayedSuppliers: 0,
        pendingRequests: 0,
        devicesRequiringMaintenance: 0,
        partsInstalledToday: 0,
      };
      switch (id) {
        case "openTickets":
          return {
            title: "Open Tickets",
            value: c.openTickets,
            subtitle: "Active support requests",
            href: "/tickets?status=open",
            linkText: "View",
          };
        case "lowStock":
          return {
            title: "Low Stock Items",
            value: c.lowStockItems,
            subtitle: "Parts below reorder level",
            href: "/spare-parts?lowStock=1",
            linkText: "View",
          };
        case "delayedSuppliers":
          return {
            title: "Delayed Suppliers",
            value: c.delayedSuppliers,
            subtitle: "Orders past expected date",
            href: "/purchase-requests",
            linkText: "View",
          };
        case "pendingRequests":
          return {
            title: "Pending Requests",
            value: c.pendingRequests,
            subtitle: "Purchase requests awaiting action",
            href: "/purchase-requests",
            linkText: "View",
          };
        case "devicesMaintenance":
          return {
            title: "Devices in Maintenance",
            value: c.devicesRequiringMaintenance,
            subtitle: "Assets currently in maintenance",
            href: "/assets?status=in_maintenance",
            linkText: "View",
          };
        case "partsInstalledToday":
          return {
            title: "Parts Installed Today",
            value: c.partsInstalledToday,
            subtitle: "OUT transactions today",
            href: "/inventory",
            linkText: "View",
          };
        default:
          return { title: id, value: 0, subtitle: "", href: "#", linkText: "View" };
      }
    },
    [counts]
  );

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  const welcomeRoleText = isAdmin
    ? "Viewing company-wide data. Use the branch filter to narrow down."
    : role === "viewer"
      ? `Read-only access to ${branchLabel}. Contact support to request changes.`
      : `Viewing ${branchLabel} data.`;

  return (
    <DashboardLayout title="Dashboard">
      {dataError && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <strong>Demo mode.</strong> No database connected. Add Supabase URL and anon key in Netlify environment variables, then run <code className="rounded bg-muted px-1">database/schema.sql</code> in Supabase SQL Editor to see real data.
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span>{welcomeRoleText}</span>
        <Button
          variant={dashboardEditMode ? "default" : "outline"}
          size="sm"
          onClick={() => setDashboardEditMode((v) => !v)}
        >
          {dashboardEditMode ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit layout
            </>
          )}
        </Button>
      </div>
      <div className="space-y-6">
        {/* KPI Cards - reorderable in edit mode */}
        {dashboardEditMode && (
          <p className="text-sm text-muted-foreground">Drag cards to reorder; drag the right edge to resize width. Click Done to save.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiOrder.map((id) => {
            const content = getKpiCardContent(id);
            const isDragging = draggedKpiId === id;
            const span = getKpiSpan(id);
            const colClass = span === 4 ? "lg:col-span-4" : span === 2 ? "lg:col-span-2" : "lg:col-span-1";
            return (
              <Card
                key={id}
                className={`relative ${isDragging ? "opacity-50" : ""} ${colClass}`}
                draggable={dashboardEditMode}
                onDragStart={() => handleKpiDragStart(id)}
                onDragOver={handleKpiDragOver}
                onDrop={() => handleKpiDrop(id)}
                onDragEnd={handleKpiDragEnd}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {dashboardEditMode && (
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    )}
                    <CardTitle className="text-sm font-medium">{content.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{content.value}</div>
                  <p className="text-xs text-muted-foreground">{content.subtitle}</p>
                  {!dashboardEditMode && (
                    <Button variant="link" className="h-auto p-0 text-xs" asChild>
                      <Link href={content.href}>{content.linkText}</Link>
                    </Button>
                  )}
                </CardContent>
                {dashboardEditMode && (
                  <div
                    data-no-drag
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize shrink-0 rounded-r border-l border-muted-foreground/30 bg-transparent hover:bg-primary/10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart("kpi", id, e.clientX, getKpiSpan(id));
                    }}
                    aria-label="Resize card"
                  />
                )}
              </Card>
            );
          })}
        </div>

        {/* Charts & activity sections - reorderable and resizable in edit mode */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chartSectionOrder.map((id) => {
            const section = getChartSectionContent(id);
            const isDragging = draggedChartId === id;
            const span = getChartSpan(id);
            const colClass = span === 3 ? "lg:col-span-3" : span === 2 ? "lg:col-span-2" : "lg:col-span-1";
            return (
              <Card
                key={id}
                className={`relative ${isDragging ? "opacity-50" : ""} ${colClass}`}
                draggable={dashboardEditMode}
                onDragStart={() => handleChartDragStart(id)}
                onDragOver={handleChartDragOver}
                onDrop={() => handleChartDrop(id)}
                onDragEnd={handleChartDragEnd}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {dashboardEditMode && (
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    )}
                    <div className="min-w-0 space-y-1.5">
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{section.content}</CardContent>
                {dashboardEditMode && (
                  <div
                    data-no-drag
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize shrink-0 rounded-r border-l border-muted-foreground/30 bg-transparent hover:bg-primary/10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart("chart", id, e.clientX, getChartSpan(id));
                    }}
                    aria-label="Resize card"
                  />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
