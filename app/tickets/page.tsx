"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTickets, createTicket, updateTicket, generateTicketNumber, type Ticket } from "@/services/tickets";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileUp } from "lucide-react";
import { parseExcelFile, downloadTemplate } from "@/lib/excel-import";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBranch } from "@/components/branch-provider";

const formSchema = z.object({
  ticket_number: z.string(),
  requester_name: z.string().min(1, "Name required"),
  employee_id: z.string().optional(),
  email: z.string().email("Valid email required"),
  department: z.string().optional(),
  issue_type: z.string().optional(),
  description: z.string().min(1, "Description required"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open"),
});

type FormValues = z.infer<typeof formSchema>;

const TICKET_IMPORT_HEADERS = [
  "ticket_number",
  "requester_name",
  "employee_id",
  "email",
  "department",
  "issue_type",
  "description",
  "priority",
  "status",
];

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  open: "destructive",
  in_progress: "warning",
  waiting_user: "outline",
  resolved: "success",
  closed: "secondary",
};

export default function TicketsPage() {
  const { effectiveBranchId, userBranchId, isAdmin, canEdit } = useBranch();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticket_number: generateTicketNumber(),
      requester_name: "",
      employee_id: "",
      email: "",
      department: "",
      issue_type: "",
      description: "",
      priority: "medium",
      status: "open",
    },
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getTickets({
        status: statusFilter === "all" ? undefined : statusFilter,
        branchId: effectiveBranchId ?? undefined,
      });
      setTickets(data);
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

  function handleDownloadTicketTemplate() {
    downloadTemplate(TICKET_IMPORT_HEADERS, "Tickets", "tickets-import-template");
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
    const validPriority = ["low", "medium", "high", "urgent"];
    const validStatus = ["open", "in_progress", "waiting_user", "resolved", "closed"];
    try {
      const raw = await parseExcelFile(importFile);
      const rows = raw.filter(
        (r) =>
          String(r.requester_name ?? "").trim() ||
          String(r.email ?? "").trim() ||
          String(r.description ?? "").trim()
      );
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const requesterName = String(row.requester_name ?? "").trim();
        const email = String(row.email ?? "").trim();
        const description = String(row.description ?? "").trim();
        if (!requesterName || !email || !description) {
          errors.push({ row: i + 2, message: "requester_name, email, and description are required" });
          continue;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push({ row: i + 2, message: "Invalid email" });
          continue;
        }
        const priority = String(row.priority ?? "medium").trim() || "medium";
        const status = String(row.status ?? "open").trim() || "open";
        if (!validPriority.includes(priority)) {
          errors.push({ row: i + 2, message: `Invalid priority: ${priority}` });
          continue;
        }
        if (!validStatus.includes(status)) {
          errors.push({ row: i + 2, message: `Invalid status: ${status}` });
          continue;
        }
        const ticketNumber = String(row.ticket_number ?? "").trim() || generateTicketNumber();
        try {
          await createTicket({
            ticket_number: ticketNumber,
            requester_name: requesterName,
            employee_id: (row.employee_id != null && String(row.employee_id).trim()) || null,
            email,
            department: (row.department != null && String(row.department).trim()) || null,
            issue_type: (row.issue_type != null && String(row.issue_type).trim()) || null,
            description,
            priority,
            status,
            assigned_to_id: null,
            asset_id: null,
            branch_id: branchId,
            resolved_at: null,
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
      ticket_number: generateTicketNumber(),
      requester_name: "",
      employee_id: "",
      email: "",
      department: "",
      issue_type: "",
      description: "",
      priority: "medium",
      status: "open",
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
    await createTicket({
      ticket_number: values.ticket_number,
      requester_name: values.requester_name,
      employee_id: values.employee_id || null,
      email: values.email,
      department: values.department || null,
      issue_type: values.issue_type || null,
      description: values.description,
      priority: values.priority,
      status: values.status,
      assigned_to_id: null,
      asset_id: null,
      branch_id: branchId,
      resolved_at: null,
    });
    setDialogOpen(false);
    load();
  }

  return (
    <DashboardLayout title="Tickets">
      {!canEdit && (
        <p className="mb-4 text-sm text-muted-foreground">
          View only. Contact an administrator or support to create or update tickets.
        </p>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>Internal support requests</CardDescription>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openImportDialog}>
                <FileUp className="mr-2 h-4 w-4" />
                Import from Excel
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New ticket
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="waiting_user">Waiting user</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Issue type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          <Link href={`/tickets/${t.id}`} className="hover:underline">
                            {t.ticket_number}
                          </Link>
                        </TableCell>
                        <TableCell>{t.requester_name}</TableCell>
                        <TableCell>{t.department ?? "—"}</TableCell>
                        <TableCell>{t.issue_type ?? "—"}</TableCell>
                        <TableCell>{t.priority}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[t.status] ?? "secondary"}>
                            {t.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/tickets/${t.id}`}>View</Link>
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

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from Excel</DialogTitle>
            <CardDescription>Upload an .xlsx file. ticket_number is optional (auto-generated if empty). Download the template for the expected columns.</CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadTicketTemplate}>
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
                      {TICKET_IMPORT_HEADERS.map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {TICKET_IMPORT_HEADERS.map((h) => (
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
                <p className="font-medium">Imported {importResult.success} tickets. {importResult.failed} failed.</p>
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
            <DialogTitle>New ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {createError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requester name *</Label>
                <Input {...form.register("requester_name")} />
                {form.formState.errors.requester_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.requester_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input {...form.register("employee_id")} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input {...form.register("department")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Issue type</Label>
              <Input {...form.register("issue_type")} placeholder="e.g. Hardware, Software" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as FormValues["priority"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
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
