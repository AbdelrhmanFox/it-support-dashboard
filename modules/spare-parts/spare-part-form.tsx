"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SparePart } from "@/services/spare-parts";
import type { Supplier } from "@/services/suppliers";

const sparePartSchema = z.object({
  part_name: z.string().min(1, "Part name is required"),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  compatible_devices: z.string().optional(),
  sku: z.string().optional(),
  unit_price: z.coerce.number().min(0).default(0),
  supplier_id: z.string().uuid().optional().nullable(),
  current_stock: z.coerce.number().min(0).default(0),
  minimum_stock: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export type SparePartFormValues = z.infer<typeof sparePartSchema>;

interface SparePartFormProps {
  part?: SparePart | null;
  suppliers: Supplier[];
  onSubmit: (values: SparePartFormValues) => Promise<void>;
  onCancel: () => void;
}

export function SparePartForm({
  part,
  suppliers,
  onSubmit,
  onCancel,
}: SparePartFormProps) {
  const form = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: {
      part_name: part?.part_name ?? "",
      category: part?.category ?? "",
      brand: part?.brand ?? "",
      model: part?.model ?? "",
      compatible_devices: part?.compatible_devices ?? "",
      sku: part?.sku ?? "",
      unit_price: part?.unit_price ?? 0,
      supplier_id: part?.supplier_id ?? null,
      current_stock: part?.current_stock ?? 0,
      minimum_stock: part?.minimum_stock ?? 0,
      reorder_level: part?.reorder_level ?? 0,
      notes: part?.notes ?? "",
    },
  });

  async function handleSubmit(values: SparePartFormValues) {
    await onSubmit({
      ...values,
      supplier_id: values.supplier_id || null,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="part_name">Part name *</Label>
          <Input id="part_name" {...form.register("part_name")} />
          {form.formState.errors.part_name && (
            <p className="text-sm text-destructive">
              {form.formState.errors.part_name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...form.register("category")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...form.register("brand")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" {...form.register("model")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...form.register("sku")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit price</Label>
          <Input id="unit_price" type="number" step="0.01" {...form.register("unit_price")} />
        </div>
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select
            value={form.watch("supplier_id") ?? ""}
            onValueChange={(v) => form.setValue("supplier_id", v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="current_stock">Current stock</Label>
          <Input id="current_stock" type="number" {...form.register("current_stock")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimum_stock">Minimum stock</Label>
          <Input id="minimum_stock" type="number" {...form.register("minimum_stock")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorder_level">Reorder level</Label>
          <Input id="reorder_level" type="number" {...form.register("reorder_level")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="compatible_devices">Compatible devices</Label>
        <Input id="compatible_devices" {...form.register("compatible_devices")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...form.register("notes")} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : part ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
