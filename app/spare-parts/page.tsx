"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSpareParts, type SparePart } from "@/services/spare-parts";
import { getSuppliers } from "@/services/suppliers";
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
import { SparePartForm, type SparePartFormValues } from "@/modules/spare-parts/spare-part-form";
import {
  createSparePart,
  updateSparePart,
} from "@/services/spare-parts";
import { Plus, Search, FileUp } from "lucide-react";
import { parseExcelFile, downloadTemplate } from "@/lib/excel-import";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPARE_PART_IMPORT_HEADERS = [
  "part_name",
  "category",
  "brand",
  "model",
  "sku",
  "unit_price",
  "supplier_name",
  "current_stock",
  "minimum_stock",
  "reorder_level",
  "notes",
];

export default function SparePartsPage() {
  const { effectiveBranchId, userBranchId, isAdmin, canEdit } = useBranch();
  const [createError, setCreateError] = useState<string | null>(null);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof getSuppliers>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [supplierId, setSupplierId] = useState<string>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [partsRes, suppliersRes] = await Promise.all([
        getSpareParts({
          search: search || undefined,
          category: category === "all" ? undefined : category,
          supplierId: supplierId === "all" ? undefined : supplierId,
          lowStockOnly: lowStockOnly || undefined,
          branchId: effectiveBranchId ?? undefined,
        }),
        getSuppliers({ branchId: effectiveBranchId ?? undefined }),
      ]);
      setParts(partsRes);
      setSuppliers(suppliersRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, category, supplierId, lowStockOnly, effectiveBranchId]);

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

  function handleDownloadSparePartTemplate() {
    downloadTemplate(SPARE_PART_IMPORT_HEADERS, "SpareParts", "spare-parts-import-template");
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
      const rows = raw.filter((r) => String(r.part_name ?? "").trim());
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const partName = String(row.part_name ?? "").trim();
        if (!partName) {
          errors.push({ row: i + 2, message: "part_name is required" });
          continue;
        }
        let supplierId: string | null = null;
        const supplierName = (row.supplier_name != null && String(row.supplier_name).trim()) || null;
        if (supplierName) {
          const found = suppliers.find((s) => s.name.trim().toLowerCase() === supplierName.toLowerCase());
          if (!found) {
            errors.push({ row: i + 2, message: `Supplier not found: ${supplierName}` });
            continue;
          }
          supplierId = found.id;
        }
        const unitPrice = Number(row.unit_price);
        const currentStock = Number(row.current_stock);
        const minimumStock = Number(row.minimum_stock);
        const reorderLevel = Number(row.reorder_level);
        try {
          await createSparePart({
            part_name: partName,
            category: (row.category != null && String(row.category).trim()) || null,
            brand: (row.brand != null && String(row.brand).trim()) || null,
            model: (row.model != null && String(row.model).trim()) || null,
            compatible_devices: null,
            sku: (row.sku != null && String(row.sku).trim()) || null,
            unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
            supplier_id: supplierId,
            current_stock: Number.isFinite(currentStock) ? currentStock : 0,
            minimum_stock: Number.isFinite(minimumStock) ? minimumStock : 0,
            reorder_level: Number.isFinite(reorderLevel) ? reorderLevel : 0,
            notes: (row.notes != null && String(row.notes).trim()) || null,
            image_url: null,
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

  async function handleSubmit(values: SparePartFormValues) {
    const branchId = effectiveBranchId ?? userBranchId ?? null;
    if (!editingPart && !isAdmin && !branchId) {
      setCreateError("Your account is not assigned to a branch. Contact an administrator.");
      return;
    }
    setCreateError(null);
    const payload = {
      ...values,
      supplier_id: values.supplier_id || null,
      category: values.category || null,
      brand: values.brand || null,
      model: values.model || null,
      compatible_devices: values.compatible_devices || null,
      sku: values.sku || null,
      notes: values.notes || null,
      image_url: null,
      branch_id: branchId,
    };
    if (editingPart) {
      await updateSparePart(editingPart.id, payload);
    } else {
      await createSparePart(payload);
    }
    setDialogOpen(false);
    setEditingPart(null);
    load();
  }

  const categories = Array.from(new Set(parts.map((p) => p.category).filter(Boolean))) as string[];

  return (
    <DashboardLayout title="Spare Parts">
      {!canEdit && (
        <p className="mb-4 text-sm text-muted-foreground">
          View only. Contact an administrator or support to add or edit parts.
        </p>
      )}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Spare parts</CardTitle>
              <CardDescription>Manage parts, stock levels, and suppliers</CardDescription>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={openImportDialog}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import from Excel
                </Button>
                <Button onClick={() => { setEditingPart(null); setCreateError(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add part
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c!}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All suppliers</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={lowStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setLowStockOnly(!lowStockOnly)}
              >
                Low stock only
              </Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Reorder</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No parts found. Add one or adjust filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      parts.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/spare-parts/${part.id}`}
                              className="hover:underline"
                            >
                              {part.part_name}
                            </Link>
                          </TableCell>
                          <TableCell>{part.sku ?? "—"}</TableCell>
                          <TableCell>{part.category ?? "—"}</TableCell>
                          <TableCell>
                            {(part.suppliers as { name?: string } | null)?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {part.current_stock <= part.reorder_level ? (
                              <Badge variant="destructive">{part.current_stock}</Badge>
                            ) : (
                              part.current_stock
                            )}
                          </TableCell>
                          <TableCell className="text-right">{part.reorder_level}</TableCell>
                          <TableCell className="text-right">
                            {part.unit_price != null ? Number(part.unit_price).toFixed(2) : "—"}
                          </TableCell>
                          <TableCell>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingPart(part);
                                  setDialogOpen(true);
                                }}
                              >
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
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from Excel</DialogTitle>
            <CardDescription>Upload an .xlsx file. Use supplier_name to match existing suppliers in this branch. Download the template for the expected columns.</CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadSparePartTemplate}>
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
                      {SPARE_PART_IMPORT_HEADERS.slice(0, 5).map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                      <TableHead>...</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {SPARE_PART_IMPORT_HEADERS.slice(0, 5).map((h) => (
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
                <p className="font-medium">Imported {importResult.success} parts. {importResult.failed} failed.</p>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? "Edit part" : "Add spare part"}</DialogTitle>
          </DialogHeader>
          {createError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {createError}
            </div>
          )}
          <SparePartForm
            part={editingPart}
            suppliers={suppliers}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditingPart(null); }}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
