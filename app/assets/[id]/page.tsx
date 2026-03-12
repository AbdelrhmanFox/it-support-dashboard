import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssetById } from "@/services/assets";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const asset = await getAssetById(id);
  if (!asset) notFound();

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    active: "success",
    in_maintenance: "warning",
    retired: "secondary",
    lost: "destructive",
    spare: "outline",
  };

  return (
    <DashboardLayout title="Asset">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/assets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold">{asset.asset_tag}</h2>
          <Badge variant={statusVariants[asset.status] ?? "secondary"}>
            {asset.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Serial:</span> {asset.serial_number ?? "—"}</p>
              <p><span className="text-muted-foreground">Device type:</span> {asset.device_type}</p>
              <p><span className="text-muted-foreground">Brand / Model:</span> {[asset.brand, asset.model].filter(Boolean).join(" / ") || "—"}</p>
              <p><span className="text-muted-foreground">Department:</span> {asset.department ?? "—"}</p>
              <p><span className="text-muted-foreground">Location:</span> {asset.location ?? "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Assigned to:</span> {asset.assigned_user_name ?? "—"}</p>
              <p><span className="text-muted-foreground">Email:</span> {asset.assigned_user_email ?? "—"}</p>
            </CardContent>
          </Card>
        </div>
        {asset.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {asset.notes}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
