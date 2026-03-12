"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  generateRequestNumber,
  type PurchaseRequest,
} from "@/services/purchase-requests";
import { getSpareParts } from "@/services/spare-parts";
import { getSuppliers } from "@/services/suppliers";
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
import { Plus } from "lucide-react";
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

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  submitted: "outline",
  ordered: "default",
  waiting_supplier: "warning",
  delivered: "success",
  cancelled: "destructive",
};

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [parts, setParts] = useState<Awaited<ReturnType<typeof getSpareParts>>>([]);
  const [suppliers, setSuppliers] = useState<Awaited<ReturnType<typeof getSuppliers>>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

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
        getPurchaseRequests({ status: statusFilter === "all" ? undefined : statusFilter }),
        getSpareParts(),
        getSuppliers(),
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
  }, [statusFilter]);

  function openCreate() {
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
    });
    setDialogOpen(false);
    load();
  }

  return (
    <DashboardLayout title="Purchase Requests">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Purchase requests</CardTitle>
            <CardDescription>Track orders to suppliers</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button>
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
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/purchase-requests/${r.id}`}>View</Link>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New purchase request</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
