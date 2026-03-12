"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssets, type Asset } from "@/services/assets";
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
import { Plus, Search } from "lucide-react";
import { createAsset, updateAsset } from "@/services/assets";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

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
  }, [search, statusFilter]);

  function openCreate() {
    setEditing(null);
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
    };
    if (editing) {
      await updateAsset(editing.id, payload);
    } else {
      await createAsset(payload);
    }
    setDialogOpen(false);
    load();
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>IT Assets</CardTitle>
            <CardDescription>Devices, assignment, and status</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add asset
          </Button>
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
                          <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit asset" : "Add asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
