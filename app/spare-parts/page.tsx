"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSpareParts, type SparePart } from "@/services/spare-parts";
import { getSuppliers } from "@/services/suppliers";
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
import { Plus, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SparePartsPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof getSuppliers>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [supplierId, setSupplierId] = useState<string>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [partsRes, suppliersRes] = await Promise.all([
        getSpareParts({
          search: search || undefined,
          category: category === "all" ? undefined : category,
          supplierId: supplierId === "all" ? undefined : supplierId,
          lowStockOnly: lowStockOnly || undefined,
        }),
        getSuppliers(),
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
  }, [search, category, supplierId, lowStockOnly]);

  async function handleSubmit(values: SparePartFormValues) {
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
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Spare parts</CardTitle>
              <CardDescription>Manage parts, stock levels, and suppliers</CardDescription>
            </div>
            <Button onClick={() => { setEditingPart(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add part
            </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? "Edit part" : "Add spare part"}</DialogTitle>
          </DialogHeader>
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
