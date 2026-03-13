"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  generateRequestNumber,
  type PurchaseRequest,
} from "@/services/purchase-requests";
import { getSpareParts } from "@/services/spare-parts";
import { getSuppliers } from "@/services/suppliers";
import { useBranch } from "@/components/branch-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileUp } from "lucide-react";
import { parseExcelFile, downloadTemplate } from "@/lib/excel-import";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  request_number: z.string(),
  spare_part_id: z.string().uuid(),
  quantity: z.coerce.number().min(1),
  supplier_id: z.string().uuid(),
  status: z.enum(["draft", "submitted", "ordered", "waiting_supplier", "delivered", "cancelled"]).default("draft"),
  expected_delivery_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PURCHASE_REQUEST_IMPORT_HEADERS = [
  "request_number",
  "spare_part_sku",
  "supplier_name",
  "quantity",
  "request_date",
  "status",
  "expected_delivery_date",
  "notes",
];

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  submitted: "outline",
  ordered: "default",
  waiting_supplier: "warning",
  delivered: "success",
  cancelled: "destructive",
};

export default function PurchaseRequestsPage() {
  const { effectiveBranchId, userBranchId, isAdmin, canEdit } = useBranch();
  const [createError, setCreateError] = useState<string | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [parts, setParts] = useState<Awaited<ReturnType<typeof getSpareParts>>>([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof getSuppliers>>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request_number: generateRequestNumber(),
      spare_part_id: "",
      quantity: 1,
      supplier_id: "",
      status: "draft",
      expected_delivery_date: "",
    },
  });

  async function load() {
    setLoading(true);
    try {
      const [reqs, p, s] = await Promise.all([
        getPurchaseRequests({
          status: statusFilter === "all" ? undefined : statusFilter,
          branchId: effectiveBranchId ?? undefined,
        }),
        getSpareParts({ branchId: effectiveBranchId ?? undefined }),
        getSuppliers({ branchId: effectiveBranchId ?? undefined }),
      ]);
      setRequests(reqs);
      setParts(p);
      setSuppliers(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter, effectiveBranchId]);

  function openImportDialog() {
    setImportFile(null);
    setImportPreview([]);
    setImportResult(null);
    setImportDialogOpen(true);
  }

  async function handleImportFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    try {
      const rows = await parseExcelFile(file);
      setImportPreview(rows.slice(0, 5));
    } catch (err) {
      setImportResult({ success: 0, failed: 0, errors: [{ row: 0, message: String(err) }] });
    }
  }

  function handleDownloadPurchaseRequestTemplate() {
    downloadTemplate(PURCHASE_REQUEST_IMPORT_HEADERS, "PurchaseRequests", "purchase-requests-import-template");
  }

  async function handleImportSubmit() {
    if (!importFile) return;
    const branchId = effectiveBranchId ?? userBranchId ?? null;
    if (!isAdmin && !branchId) {
      setImportResult({ success: 0, failed: 0, errors: [{ row: 0, message: "Your account is not assigned to a branch. Contact an administrator." }] });
      return;
    }
    setImporting(true);
    setImportResult(null);
    const errors: { row: number; message: string }[] = [];
    let success = 0;
    const validStatuses = ["draft", "submitted", "ordered", "waiting_supplier", "delivered", "cancelled"];
    try {
      const raw = await parseExcelFile(importFile);
      const rows = raw.filter(
        (r) =>
          String(r.spare_part_sku ?? r.part_name ?? "").trim() ||
          String(r.supplier_name ?? "").trim() ||
          Number(r.quantity) > 0
      );
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const partSku = String(row.spare_part_sku ?? row.part_name ?? "").trim();
        const supplierName = String(row.supplier_name ?? "").trim();
        const qty = Number(row.quantity);
        if (!partSku || !supplierName) {
          errors.push({ row: i + 2, message: "spare_part_sku and supplier_name are required" });
          continue;
        }
        if (!Number.isFinite(qty) || qty < 1) {
          errors.push({ row: i + 2, message: "quantity must be at least 1" });
          continue;
        }
        const part = parts.find(
          (p) =>
            (p.sku && p.sku.trim().toLowerCase() === partSku.toLowerCase()) ||
            p.part_name.trim().toLowerCase() === partSku.toLowerCase()
        );
        const supplier = suppliers.find((s) => s.name.trim().toLowerCase() === supplierName.toLowerCase());
        if (!part) {
          errors.push({ row: i + 2, message: `Part not found: ${partSku}` });
          continue;
        }
        if (!supplier) {
          errors.push({ row: i + 2, message: `Supplier not found: ${supplierName}` });
          continue;
        }
        const status = String(row.status ?? "draft").trim() || "draft";
        if (!validStatuses.includes(status)) {
          errors.push({ row: i + 2, message: `Invalid status: ${status}` });
          continue;
        }
        const requestDate = String(row.request_date ?? "").trim() || new Date().toISOString().slice(0, 10);
        const requestNumber = String(row.request_number ?? "").trim() || generateRequestNumber();
        try {
          await createPurchaseRequest({
            request_number: requestNumber,
            spare_part_id: part.id,
            quantity: qty,
            supplier_id: supplier.id,
            status,
            expected_delivery_date: (row.expected_delivery_date != null && String(row.expected_delivery_date).trim()) || null,
            notes: (row.notes != null && String(row.notes).trim()) || null,
            requested_by_id: null,
            request_date: requestDate,
            actual_delivery_date: null,
            branch_id: branchId,
          });
          success++;
        } catch (err) {
          errors.push({ row: i + 2, message: err instanceof Error ? err.message : String(err) });
        }
      }
      setImportResult({ success, failed: errors.length, errors });
      if (success > 0) load();
    } catch (err) {
      setImportResult({ success: 0, failed: 0, errors: [{ row: 0, message: err instanceof Error ? err.message : String(err) }] });
    } finally {
      setImporting(false);
    }
  }

  function openCreate() {
    setCreateError(null);
    form.reset({
      request_number: generateRequestNumber(),
      spare_part_id: "",
      quantity: 1,
      supplier_id: "",
      status: "draft",
      expected_delivery_date: "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: FormValues) {
    const branchId = effectiveBranchId ?? userBranchId ?? null;
    if (!isAdmin && !branchId) {
      setCreateError("Your account is not assigned to a branch. Contact an administrator.");
      return;
    }
    setCreateError(null);
    await createPurchaseRequest({
      request_number: values.request_number,
      spare_part_id: values.spare_part_id,
      quantity: values.quantity,
      supplier_id: values.supplier_id,
      status: values.status,
      expected_delivery_date: values.expected_delivery_date || null,
      notes: null,
      requested_by_id: null,
      request_date: new Date().toISOString().slice(0, 10),
      actual_delivery_date: null,
      branch_id: branchId,
    });
    setDialogOpen(false);
    load();
  }

  return (
    <DashboardLayout title="Purchase Requests">
      {!canEdit && (
        <p className="mb-4 text-sm text-muted-foreground">
          View only. Contact an administrator or support to create purchase requests.
        </p>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Purchase requests</CardTitle>
            <CardDescription>Track orders to suppliers</CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImportDialog}>
                <FileUp className="mr-2 h-4 w-4" />
                Import from Excel
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New request
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="waiting_supplier">Waiting supplier</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          <Link href={`/purchase-requests/${r.id}`} className="hover:underline">
                            {r.request_number}
                          </Link>
                        </TableCell>
                        <TableCell>{(r.spare_parts as { part_name?: string })?.part_name ?? "—"}</TableCell>
                        <TableCell>{(r.suppliers as { name?: string })?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">{r.quantity}</TableCell>
                        <TableCell>{r.expected_delivery_date ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[r.status] ?? "secondary"}>
                            {r.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/purchase-requests/${r.id}`}>View</Link>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (!confirm(`Delete purchase request ${r.request_number}?`)) return;
                                  try {
                                    await deletePurchaseRequest(r.id);
                                    load();
                                  } catch (e) {
                                    alert(e instanceof Error ? e.message : String(e));
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from Excel</DialogTitle>
            <CardDescription>Use spare_part_sku (or part name) and supplier_name to match parts and suppliers in this branch. request_number and request_date are optional.</CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadPurchaseRequestTemplate}>
                Download template
              </Button>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFileSelect} />
                Choose file
              </label>
              {importFile && <span className="text-sm text-muted-foreground">{importFile.name}</span>}
            </div>
            {importPreview.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {PURCHASE_REQUEST_IMPORT_HEADERS.map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {PURCHASE_REQUEST_IMPORT_HEADERS.map((h) => (
                          <TableCell key={h}>{String(row[h] ?? "")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {importResult && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">Imported {importResult.success} requests. {importResult.failed} failed.</p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-destructive">
                    {importResult.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                    {importResult.errors.length > 10 && <li>… and {importResult.errors.length - 10} more</li>}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleImportSubmit} disabled={!importFile || importing}>
                {importing ? "Importing…" : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New purchase request</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Request number</Label>
              <Input {...form.register("request_number")} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Spare part *</Label>
              <Select
                value={form.watch("spare_part_id")}
                onValueChange={(v) => form.setValue("spare_part_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select part" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.part_name} {p.sku ? `(${p.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select
                value={form.watch("supplier_id")}
                onValueChange={(v) => form.setValue("supplier_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" {...form.register("quantity")} />
              </div>
              <div className="space-y-2">
                <Label>Expected delivery</Label>
                <Input type="date" {...form.register("expected_delivery_date")} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
