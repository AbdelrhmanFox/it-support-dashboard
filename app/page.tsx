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
  type DashboardCounts as CountsType,
  type TicketsPerMonthItem,
  type InventoryStatusItem,
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
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, tpm, inv, act] = await Promise.all([
          getDashboardCounts(),
          getTicketsPerMonth(6),
          getInventoryStatus(),
          getRecentActivity(10),
        ]);
        setCounts(c);
        setTicketsPerMonth(tpm);
        setInventoryStatus(inv);
        setActivity(act);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
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
