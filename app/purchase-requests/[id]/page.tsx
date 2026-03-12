import Link from "next/link";
import { notFound } from "next/navigation";
import { getPurchaseRequestById } from "@/services/purchase-requests";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  draft: "secondary",
  submitted: "outline",
  ordered: "default",
  waiting_supplier: "warning",
  delivered: "success",
  cancelled: "destructive",
};

export default async function PurchaseRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pr = await getPurchaseRequestById(id);
  if (!pr) notFound();

  const partName = (pr.spare_parts as { part_name?: string })?.part_name;
  const supplierName = (pr.suppliers as { name?: string })?.name;

  return (
    <DashboardLayout title="Purchase request">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchase-requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold">{pr.request_number}</h2>
          <Badge variant={statusColors[pr.status] ?? "secondary"}>
            {pr.status.replace("_", " ")}
          </Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Part:</span> {partName ?? "—"}</p>
            <p><span className="text-muted-foreground">Supplier:</span> {supplierName ?? "—"}</p>
            <p><span className="text-muted-foreground">Quantity:</span> {pr.quantity}</p>
            <p><span className="text-muted-foreground">Request date:</span> {pr.request_date}</p>
            <p><span className="text-muted-foreground">Expected delivery:</span> {pr.expected_delivery_date ?? "—"}</p>
            <p><span className="text-muted-foreground">Actual delivery:</span> {pr.actual_delivery_date ?? "—"}</p>
            {pr.notes && (
              <p><span className="text-muted-foreground">Notes:</span> {pr.notes}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
