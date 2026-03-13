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
import { Plus, Search } from "lucide-react";
import { createSupplier, updateSupplier } from "@/services/suppliers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
      {!canEdit && (
        <p className="mb-4 text-sm text-muted-foreground">
          View only. Contact an administrator or support to add or edit suppliers.
        </p>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Manage supplier contacts and SLA</CardDescription>
          </div>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add supplier
            </Button>
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
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
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
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No suppliers found.
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
                            <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
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
    </DashboardLayout>
  );
}
