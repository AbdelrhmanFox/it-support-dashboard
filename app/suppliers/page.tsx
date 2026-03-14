"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSuppliers, type Supplier } from "@/services/suppliers";
import { useBranch } from "@/components/branch-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, FileUp } from "lucide-react";
import { createSupplier, updateSupplier, deleteSupplier } from "@/services/suppliers";
import { parseExcelFile, downloadTemplate } from "@/lib/excel-import";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonRow } from "@/components/ui/skeleton-row";
import { EmptyState } from "@/components/ui/empty-state";

const SUPPLIER_IMPORT_HEADERS = ["name", "contact_person", "phone", "email", "sla_days", "notes"];

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  sla_days: z.coerce.number().min(0).default(7),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const { effectiveBranchId, userBranchId, isAdmin, canEdit } = useBranch();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => typeof window !== "undefined" && sessionStorage.getItem("viewer-banner-dismissed") === "true");

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      sla_days: 7,
      notes: "",
    },
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getSuppliers({
        search: search || undefined,
        branchId: effectiveBranchId ?? undefined,
      });
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, effectiveBranchId]);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    form.reset({ name: "", contact_person: "", phone: "", email: "", sla_days: 7, notes: "" });
    setDialogOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setFormError(null);
    form.reset({
      name: s.name,
      contact_person: s.contact_person ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      sla_days: s.sla_days ?? 7,
      notes: s.notes ?? "",
    });
    setDialogOpen(true);
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

  function handleDownloadSupplierTemplate() {
    downloadTemplate(SUPPLIER_IMPORT_HEADERS, "Suppliers", "suppliers-import-template");
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
      const rows = raw.filter((r) => String(r.name ?? "").trim());
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row.name ?? "").trim();
        if (!name) {
          errors.push({ row: i + 2, message: "name is required" });
          continue;
        }
        const emailVal = row.email != null ? String(row.email).trim() : "";
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
          errors.push({ row: i + 2, message: "Invalid email" });
          continue;
        }
        let slaDays = 7;
        if (row.sla_days != null && row.sla_days !== "") {
          const n = Number(row.sla_days);
          if (!Number.isFinite(n) || n < 0) {
            errors.push({ row: i + 2, message: "sla_days must be a non-negative number" });
            continue;
          }
          slaDays = n;
        }
        try {
          await createSupplier({
            name,
            contact_person: (row.contact_person != null && String(row.contact_person).trim()) || null,
            phone: (row.phone != null && String(row.phone).trim()) || null,
            email: emailVal || null,
            sla_days: slaDays,
            notes: (row.notes != null && String(row.notes).trim()) || null,
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

  async function onSubmit(values: SupplierFormValues) {
    setFormError(null);
    const branchId = effectiveBranchId ?? userBranchId ?? null;
    if (!editing && !isAdmin && !branchId) {
      setFormError("Your account is not assigned to a branch. Contact an administrator.");
      return;
    }
    const payload = {
      name: values.name,
      contact_person: values.contact_person || null,
      phone: values.phone || null,
      email: values.email || null,
      sla_days: values.sla_days,
      notes: values.notes || null,
      branch_id: branchId,
    };
    try {
      if (editing) {
        await updateSupplier(editing.id, payload);
      } else {
        await createSupplier(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e: unknown) {
      const err = e as { message?: string; error_description?: string; details?: string };
      const message =
        err?.message ||
        err?.error_description ||
        err?.details ||
        (typeof e === "string" ? e : "Something went wrong. Check the console.");
      setFormError(message);
      console.error("Supplier save error:", e);
    }
  }

  return (
    <DashboardLayout title="Suppliers">
      {!canEdit && !bannerDismissed && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You have <strong>read-only access</strong> to this section. To make changes, contact your branch administrator.
          </p>
          <button
            type="button"
            onClick={() => { setBannerDismissed(true); sessionStorage.setItem("viewer-banner-dismissed", "true"); }}
            className="ml-4 shrink-0 text-lg leading-none text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Manage supplier contacts and SLA</CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImportDialog}>
                <FileUp className="mr-2 h-4 w-4" />
                Import from Excel
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add supplier
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SLA (days)</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonRow columns={6} rows={5} />
                  ) : suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          title="No suppliers found"
                          description="Add your first supplier."
                          action={canEdit ? { label: "+ Add supplier", onClick: () => { setDialogOpen(true); setEditing(null); } } : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          <Link href={`/suppliers/${s.id}`} className="hover:underline">
                            {s.name}
                          </Link>
                        </TableCell>
                        <TableCell>{s.contact_person ?? "—"}</TableCell>
                        <TableCell>{s.phone ?? "—"}</TableCell>
                        <TableCell>{s.email ?? "—"}</TableCell>
                        <TableCell>{s.sla_days}</TableCell>
                        <TableCell>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                                Edit
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={async () => {
                                    if (!confirm(`Delete supplier "${s.name}"? This cannot be undone if referenced elsewhere.`)) return;
                                    try {
                                      await deleteSupplier(s.id);
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
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadSupplierTemplate}>
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
                      {SUPPLIER_IMPORT_HEADERS.map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {SUPPLIER_IMPORT_HEADERS.map((h) => (
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
                <p className="font-medium">Imported {importResult.success} suppliers. {importResult.failed} failed.</p>
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
            <DialogTitle>{editing ? "Edit supplier" : "Add supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact person</Label>
                <Input {...form.register("contact_person")} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label>SLA (days)</Label>
              <Input type="number" {...form.register("sla_days")} />
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
                {form.formState.isSubmitting ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete supplier"
        description={deleteTarget ? `Delete supplier "${deleteTarget.name}"? This cannot be undone if referenced elsewhere.` : ""}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleteLoading(true);
          try {
            await deleteSupplier(deleteTarget.id);
            load();
            setDeleteTarget(null);
            toast.success("Supplier deleted");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : String(e));
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
