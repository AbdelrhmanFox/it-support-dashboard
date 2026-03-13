"use client";

import { useState, useEffect } from "react";
import { useBranch } from "@/components/branch-provider";
import {
  getReportData,
  exportToExcel,
  type ReportType,
} from "@/services/reports";
import {
  getTicketsPerMonth,
  getMaintenanceStatsByMonth,
} from "@/services/dashboard";
import { getPurchaseRequests } from "@/services/purchase-requests";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "tickets", label: "Tickets report" },
  { value: "inventory", label: "Inventory / spare parts" },
  { value: "suppliers", label: "Suppliers" },
  { value: "purchase_requests", label: "Purchase requests" },
  { value: "assets", label: "IT assets" },
];

export default function ReportsPage() {
  const { effectiveBranchId } = useBranch();
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketsPerMonth, setTicketsPerMonth] = useState<{ month: string; count: number }[]>([]);
  const [maintenancePerMonth, setMaintenancePerMonth] = useState<{ month: string; count: number }[]>([]);
  const [supplierStats, setSupplierStats] = useState<{ delivered: number; delayed: number }>({ delivered: 0, delayed: 0 });

  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      try {
        const [tpm, maint, prs] = await Promise.all([
          getTicketsPerMonth(12, effectiveBranchId ?? undefined),
          getMaintenanceStatsByMonth(12, effectiveBranchId ?? undefined),
          getPurchaseRequests({ branchId: effectiveBranchId ?? undefined }),
        ]);
        if (cancelled) return;
        setTicketsPerMonth(tpm);
        setMaintenancePerMonth(maint);
        const today = new Date().toISOString().slice(0, 10);
        let delivered = 0;
        let delayed = 0;
        (prs || []).forEach((r: { status: string; expected_delivery_date: string | null }) => {
          if (r.status === "delivered") delivered++;
          else if (r.expected_delivery_date && r.expected_delivery_date < today && !["delivered", "cancelled"].includes(r.status)) delayed++;
        });
        setSupplierStats({ delivered, delayed });
      } catch {
        // ignore
      }
    }
    loadAnalytics();
    return () => { cancelled = true; };
  }, [effectiveBranchId]);

  async function handleExport() {
    if (!reportType) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReportData(reportType, effectiveBranchId ?? undefined);
      const sheetName = REPORT_OPTIONS.find((r) => r.value === reportType)?.label ?? reportType;
      const filename = `IT-Support-${reportType}-${new Date().toISOString().slice(0, 10)}`;
      exportToExcel(data, sheetName, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        {/* Analytics summary */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics overview</CardTitle>
            <CardDescription>
              Monthly ticket statistics, device maintenance, and supplier performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Tickets per month (last 12 months)</h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ticketsPerMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Maintenance entries per month (last 12 months)</h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenancePerMonth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Supplier performance (purchase requests)</h4>
              <div className="flex gap-6">
                <div className="rounded-lg border bg-muted/50 px-4 py-2">
                  <span className="text-2xl font-bold text-green-600">{supplierStats.delivered}</span>
                  <span className="ml-2 text-sm text-muted-foreground">Delivered</span>
                </div>
                <div className="rounded-lg border bg-muted/50 px-4 py-2">
                  <span className="text-2xl font-bold text-amber-600">{supplierStats.delayed}</span>
                  <span className="ml-2 text-sm text-muted-foreground">Delayed (past expected)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export reports</CardTitle>
            <CardDescription>
              Generate and download reports as Excel (.xlsx) for tickets, inventory, suppliers,
              purchase requests, and assets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report type</label>
                <Select
                  value={reportType}
                  onValueChange={(v) => setReportType(v as ReportType)}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select report" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExport}
                disabled={!reportType || loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Export to Excel
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report descriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Tickets report</strong> — All support tickets with requester, department, issue type, status, and dates.</p>
            <p><strong>Inventory / spare parts</strong> — Spare parts list with stock levels, reorder levels, and supplier.</p>
            <p><strong>Suppliers</strong> — Supplier contact details and SLA.</p>
            <p><strong>Purchase requests</strong> — Purchase requests with part, supplier, quantity, and delivery dates.</p>
            <p><strong>IT assets</strong> — Asset list with tag, type, assignment, and status.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
