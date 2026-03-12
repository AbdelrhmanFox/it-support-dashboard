"use client";

import { useState } from "react";
import {
  getReportData,
  exportToExcel,
  type ReportType,
} from "@/services/reports";
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

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "tickets", label: "Tickets report" },
  { value: "inventory", label: "Inventory / spare parts" },
  { value: "suppliers", label: "Suppliers" },
  { value: "purchase_requests", label: "Purchase requests" },
  { value: "assets", label: "IT assets" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!reportType) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReportData(reportType);
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
