import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplierById } from "@/services/suppliers";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();

  return (
    <DashboardLayout title="Supplier">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold">{supplier.name}</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contact & SLA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Contact person:</span> {supplier.contact_person ?? "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {supplier.phone ?? "—"}</p>
            <p><span className="text-muted-foreground">Email:</span> {supplier.email ?? "—"}</p>
            <p><span className="text-muted-foreground">SLA (days):</span> {supplier.sla_days}</p>
            {supplier.notes && (
              <p><span className="text-muted-foreground">Notes:</span> {supplier.notes}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
