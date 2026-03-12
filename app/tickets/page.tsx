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
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  open: "destructive",
  in_progress: "warning",
  waiting_user: "outline",
  resolved: "success",
  closed: "secondary",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

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
      const data = await getTickets({ status: statusFilter === "all" ? undefined : statusFilter });
      setTickets(data);
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
      resolved_at: null,
    });
    setDialogOpen(false);
    load();
  }

  return (
    <DashboardLayout title="Tickets">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>Internal support requests</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New ticket
          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
