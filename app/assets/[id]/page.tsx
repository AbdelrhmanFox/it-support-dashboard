import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssetById } from "@/services/assets";
import { getAssetHistory } from "@/services/asset-history";
import { getTickets } from "@/services/tickets";
import { getAssetAttachments } from "@/services/asset-attachments";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssetProfileTabs } from "@/components/asset-profile-tabs";
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

  const [maintenanceHistory, ticketsLinked, attachments] = await Promise.all([
    getAssetHistory({ assetId: id, limit: 50 }),
    getTickets({ assetId: id }).catch(() => []),
    getAssetAttachments(id).catch(() => []),
  ]);

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
        <AssetProfileTabs
          asset={asset}
          maintenanceHistory={maintenanceHistory}
          ticketsLinked={ticketsLinked}
          attachments={attachments}
        />
      </div>
    </DashboardLayout>
  );
}
