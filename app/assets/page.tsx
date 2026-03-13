"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssets, type Asset } from "@/services/assets";
import { useBranch } from "@/components/branch-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, FileUp } from "lucide-react";
import { createAsset, updateAsset } from "@/services/assets";
import { parseExcelFile, downloadTemplate } from "@/lib/excel-import";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ASSET_IMPORT_HEADERS = [
  "asset_tag",
  "serial_number",
  "device_type",
  "brand",
  "model",
  "status",
  "assigned_user_name",
  "assigned_user_email",
  "department",
  "location",
  "notes",
  "purchase_date",
  "warranty_start",
  "warranty_end",
];

const assetSchema = z.object({
  asset_tag: z.string().min(1, "Asset tag required"),
  serial_number: z.string().optional(),
  device_type: z.string().min(1, "Device type required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(["active", "in_maintenance", "retired", "lost", "spare"]).default("active"),
  assigned_user_name: z.string().optional(),
  assigned_user_email: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_start: z.string().optional(),
  warranty_end: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function AssetsPage() {
  const { effectiveBranchId, userBranchId, isAdmin, canEdit } = useBranch();
  const [createError, setCreateError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_tag: "",
      serial_number: "",
      device_type: "",
      brand: "",
      model: "",
      status: "active",
      assigned_user_name: "",
      assigned_user_email: "",
      department: "",
      location: "",
      notes: "",
      purchase_date: "",
      warranty_start: "",
      warranty_end: "",
    },
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getAssets({
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        branchId: effectiveBranchId ?? undefined,
      });
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, statusFilter, effectiveBranchId]);

  function openCreate() {
    setEditing(null);
    setCreateError(null);
    form.reset({
      asset_tag: "",
      serial_number: "",
      device_type: "",
      brand: "",
      model: "",
      status: "active",
      assigned_user_name: "",
      assigned_user_email: "",
      department: "",
      location: "",
      notes: "",
      purchase_date: "",
      warranty_start: "",
      warranty_end: "",
    });
    setDialogOpen(true);
  }

  function openEdit(a: Asset) {
    setEditing(a);
    form.reset({
      asset_tag: a.asset_tag,
      serial_number: a.serial_number ?? "",
      device_type: a.device_type,
      brand: a.brand ?? "",
      model: a.model ?? "",
      status: a.status as AssetFormValues["status"],
      assigned_user_name: a.assigned_user_name ?? "",
      assigned_user_email: a.assigned_user_email ?? "",
      department: a.department ?? "",
      location: a.location ?? "",
      notes: a.notes ?? "",
      purchase_date: a.purchase_date ? a.purchase_date.toString().slice(0, 10) : "",
      warranty_start: a.warranty_start ? a.warranty_start.toString().slice(0, 10) : "",
      warranty_end: a.warranty_end ? a.warranty_end.toString().slice(0, 10) : "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: AssetFormValues) {
    const branchId = effectiveBranchId ?? userBranchId ?? null;
    if (!isAdmin && !branchId) {
      setCreateError("Your account is not assigned to a branch. Contact an administrator.");
      return;
    }
    setCreateError(null);
    const payload = {
      asset_tag: values.asset_tag,
      serial_number: values.serial_number || null,
      device_type: values.device_type,
      brand: values.brand || null,
      model: values.model || null,
      status: values.status,
      assigned_user_name: values.assigned_user_name || null,
      assigned_user_email: values.assigned_user_email || null,
      department: values.department || null,
      location: values.location || null,
      notes: values.notes || null,
      purchase_date: values.purchase_date || null,
      warranty_start: values.warranty_start || null,
      warranty_end: values.warranty_end || null,
      branch_id: branchId,
    };
    if (editing) {
      await updateAsset(editing.id, payload);
    } else {
      await createAsset(payload);
    }
    setDialogOpen(false);
    load();
  }

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

  function handleDownloadAssetTemplate() {
    downloadTemplate(ASSET_IMPORT_HEADERS, "Assets", "assets-import-template");
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
    try {
      const raw = await parseExcelFile(importFile);
      const rows = raw.filter((r) => String(r.asset_tag ?? "").trim() || String(r.device_type ?? "").trim());
      const validStatuses = ["active", "in_maintenance", "retired", "lost", "spare"];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const assetTag = String(row.asset_tag ?? "").trim();
        const deviceType = String(row.device_type ?? "").trim();
        if (!assetTag || !deviceType) {
          errors.push({ row: i + 2, message: "asset_tag and device_type are required" });
          continue;
        }
        const status = String(row.status ?? "active").trim() || "active";
        if (!validStatuses.includes(status)) {
          errors.push({ row: i + 2, message: `Invalid status: ${status}` });
          continue;
        }
        try {
          await createAsset({
            asset_tag: assetTag,
            serial_number: (row.serial_number != null && String(row.serial_number).trim()) || null,
            device_type: deviceType,
            brand: (row.brand != null && String(row.brand).trim()) || null,
            model: (row.model != null && String(row.model).trim()) || null,
            status,
            assigned_user_name: (row.assigned_user_name != null && String(row.assigned_user_name).trim()) || null,
            assigned_user_email: (row.assigned_user_email != null && String(row.assigned_user_email).trim()) || null,
            department: (row.department != null && String(row.department).trim()) || null,
            location: (row.location != null && String(row.location).trim()) || null,
            notes: (row.notes != null && String(row.notes).trim()) || null,
            purchase_date: (row.purchase_date != null && String(row.purchase_date).trim()) || null,
            warranty_start: (row.warranty_start != null && String(row.warranty_start).trim()) || null,
            warranty_end: (row.warranty_end != null && String(row.warranty_end).trim()) || null,
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

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    active: "success",
    in_maintenance: "warning",
    retired: "secondary",
    lost: "destructive",
    spare: "outline",
  };

  return (
    <DashboardLayout title="Assets">
      {!canEdit && (
        <p className="mb-4 text-sm text-muted-foreground">
          View only. Contact an administrator or support to add or edit assets.
        </p>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>IT Assets</CardTitle>
            <CardDescription>Devices, assignment, and status</CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImportDialog}>
                <FileUp className="mr-2 h-4 w-4" />
                Import from Excel
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add asset
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tag, serial, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_maintenance">In maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="spare">Spare</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No assets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <Link href={`/assets/${a.id}`} className="hover:underline">
                            {a.asset_tag}
                          </Link>
                        </TableCell>
                        <TableCell>{a.device_type}</TableCell>
                        <TableCell>{[a.brand, a.model].filter(Boolean).join(" / ") || "—"}</TableCell>
                        <TableCell>{a.assigned_user_name ?? "—"}</TableCell>
                        <TableCell>{a.department ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[a.status] ?? "secondary"}>
                            {a.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                              Edit
                            </Button>
                          )}
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
            <CardDescription>Upload an .xlsx file. First row should be headers. Download the template for the expected columns.</CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadAssetTemplate}>
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
                      {ASSET_IMPORT_HEADERS.slice(0, 5).map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                      <TableHead>...</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {ASSET_IMPORT_HEADERS.slice(0, 5).map((h) => (
                          <TableCell key={h}>{String(row[h] ?? "")}</TableCell>
                        ))}
                        <TableCell>—</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {importResult && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">Imported {importResult.success} assets. {importResult.failed} failed.</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit asset" : "Add asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset tag *</Label>
                <Input {...form.register("asset_tag")} />
                {form.formState.errors.asset_tag && (
                  <p className="text-sm text-destructive">{form.formState.errors.asset_tag.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Serial number</Label>
                <Input {...form.register("serial_number")} />
              </div>
              <div className="space-y-2">
                <Label>Device type *</Label>
                <Input {...form.register("device_type")} placeholder="e.g. Laptop, Printer" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as AssetFormValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in_maintenance">In maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="spare">Spare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input {...form.register("brand")} />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input {...form.register("model")} />
              </div>
              <div className="space-y-2">
                <Label>Assigned to (name)</Label>
                <Input {...form.register("assigned_user_name")} />
              </div>
              <div className="space-y-2">
                <Label>Assigned to (email)</Label>
                <Input type="email" {...form.register("assigned_user_email")} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input {...form.register("department")} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...form.register("location")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea {...form.register("notes")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
