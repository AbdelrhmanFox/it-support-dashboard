import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicketById } from "@/services/tickets";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  open: "destructive",
  in_progress: "warning",
  waiting_user: "outline",
  resolved: "success",
  closed: "secondary",
};

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  return (
    <DashboardLayout title="Ticket">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold">{ticket.ticket_number}</h2>
          <Badge variant={statusColors[ticket.status] ?? "secondary"}>
            {ticket.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline">{ticket.priority}</Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Requester:</span> {ticket.requester_name}</p>
            <p><span className="text-muted-foreground">Email:</span> {ticket.email}</p>
            <p><span className="text-muted-foreground">Employee ID:</span> {ticket.employee_id ?? "—"}</p>
            <p><span className="text-muted-foreground">Department:</span> {ticket.department ?? "—"}</p>
            <p><span className="text-muted-foreground">Issue type:</span> {ticket.issue_type ?? "—"}</p>
            <p><span className="text-muted-foreground">Created:</span> {new Date(ticket.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">
            {ticket.description}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
