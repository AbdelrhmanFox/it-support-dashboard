"use client";

import { useEffect, useState } from "react";
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

export default function DashboardPage() {
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
          getDashboardCounts(),
          getTicketsPerMonth(6),
          getInventoryStatus(),
          getMostCommonIssues(6),
          getPartsConsumptionByMonth(6),
          getMaintenanceStatsByMonth(6),
          getRecentActivity(10),
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
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {dataError && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <strong>Demo mode.</strong> No database connected. Add Supabase URL and anon key in Netlify environment variables, then run <code className="rounded bg-muted px-1">database/schema.sql</code> in Supabase SQL Editor to see real data.
        </div>
      )}
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.openTickets ?? 0}</div>
              <p className="text-xs text-muted-foreground">Active support requests</p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/tickets?status=open">View</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.lowStockItems ?? 0}</div>
              <p className="text-xs text-muted-foreground">Parts below reorder level</p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/spare-parts?lowStock=1">View</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delayed Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.delayedSuppliers ?? 0}</div>
              <p className="text-xs text-muted-foreground">Orders past expected date</p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/purchase-requests">View</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.pendingRequests ?? 0}</div>
              <p className="text-xs text-muted-foreground">Purchase requests awaiting action</p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/purchase-requests">View</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices in Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.devicesRequiringMaintenance ?? 0}</div>
              <p className="text-xs text-muted-foreground">Assets currently in maintenance</p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/assets?status=in_maintenance">View</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parts Installed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts?.partsInstalledToday ?? 0}</div>
              <p className="text-xs text-muted-foreground">OUT transactions today</p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <Link href="/inventory">View</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tickets per month</CardTitle>
              <CardDescription>Support ticket trend (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Inventory status</CardTitle>
              <CardDescription>Parts by stock level</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Second row: Most common issues, Parts consumption, Maintenance stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Most common issues</CardTitle>
              <CardDescription>Tickets by issue type</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Parts consumption</CardTitle>
              <CardDescription>OUT quantity per month (6 months)</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Device maintenance</CardTitle>
              <CardDescription>History entries per month (6 months)</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest tickets, purchase requests, and stock movements</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
