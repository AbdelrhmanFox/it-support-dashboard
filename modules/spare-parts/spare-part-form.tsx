"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Search } from "lucide-react";
import { DEVICE_TYPE_OPTIONS } from "@/lib/constants";
import type { SparePart } from "@/services/spare-parts";
import type { Supplier } from "@/services/suppliers";
import type { Asset } from "@/services/assets";

const sparePartSchema = z.object({
  part_name: z.string().min(1, "Part name is required"),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  is_consumable: z.boolean().default(false),
  sku: z.string().optional(),
  unit_price: z.coerce.number().min(0).default(0),
  supplier_id: z.string().uuid().optional().nullable(),
  current_stock: z.coerce.number().min(0).default(0),
  minimum_stock: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export type SparePartFormValues = z.infer<typeof sparePartSchema>;

export type SparePartFormSubmitPayload = SparePartFormValues & { linked_asset_ids?: string[] };

interface SparePartFormProps {
  part?: SparePart | null;
  suppliers: Supplier[];
  assets: Asset[];
  linkedAssetIds?: string[];
  onSubmit: (values: SparePartFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
}

export function SparePartForm({
  part,
  suppliers,
  assets,
  linkedAssetIds = [],
  onSubmit,
  onCancel,
}: SparePartFormProps) {
  const [linkedAssetIdsState, setLinkedAssetIdsState] = useState<string[]>(linkedAssetIds);
  const [assetSearch, setAssetSearch] = useState("");

  useEffect(() => {
    setLinkedAssetIdsState(linkedAssetIds);
  }, [linkedAssetIds]);

  const form = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartSchema),
    defaultValues: {
      part_name: part?.part_name ?? "",
      category: part?.category ?? "",
      brand: part?.brand ?? "",
      model: part?.model ?? "",
      is_consumable: part?.is_consumable ?? false,
      sku: part?.sku ?? "",
      unit_price: part?.unit_price ?? 0,
      supplier_id: part?.supplier_id ?? null,
      current_stock: part?.current_stock ?? 0,
      minimum_stock: part?.minimum_stock ?? 0,
      reorder_level: part?.reorder_level ?? 0,
      notes: part?.notes ?? "",
    },
  });

  const filteredAssets = useMemo(() => {
    const q = assetSearch.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        (a.serial_number?.toLowerCase().includes(q)) ||
        (a.asset_tag?.toLowerCase().includes(q)) ||
        (a.device_type?.toLowerCase().includes(q))
    );
  }, [assets, assetSearch]);

  async function handleSubmit(values: SparePartFormValues) {
    await onSubmit({
      ...values,
      supplier_id: values.supplier_id || null,
      is_consumable: values.is_consumable ?? false,
      linked_asset_ids: linkedAssetIdsState,
    });
  }

  function toggleLinkedAsset(assetId: string) {
    setLinkedAssetIdsState((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
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
          <Label>Category</Label>
          <Select
            value={form.watch("category") || "__none__"}
            onValueChange={(v) => form.setValue("category", v === "__none__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {DEVICE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            value={form.watch("supplier_id") ?? "__none__"}
            onValueChange={(v) => form.setValue("supplier_id", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
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
        <Label>Device assets</Label>
        <p className="text-xs text-muted-foreground">Select which assets this part can be used for. Search by serial number (SN) or asset tag.</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by SN or asset tag..."
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-48 overflow-auto rounded-md border p-2 space-y-1">
          {filteredAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No assets match. Add assets in the Assets tab.</p>
          ) : (
            filteredAssets.map((asset) => (
              <label
                key={asset.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={linkedAssetIdsState.includes(asset.id)}
                  onChange={() => toggleLinkedAsset(asset.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="font-medium">{asset.asset_tag}</span>
                {asset.serial_number && (
                  <span className="text-muted-foreground">SN: {asset.serial_number}</span>
                )}
                <span className="text-muted-foreground">{asset.device_type}</span>
              </label>
            ))
          )}
        </div>
        {linkedAssetIdsState.length > 0 && (
          <p className="text-xs text-muted-foreground">{linkedAssetIdsState.length} asset(s) selected</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_consumable"
          checked={form.watch("is_consumable") ?? false}
          onChange={(e) => form.setValue("is_consumable", e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="is_consumable" className="cursor-pointer text-sm font-normal">
          One-time use (consumable)
        </Label>
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
