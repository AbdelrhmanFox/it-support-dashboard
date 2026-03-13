import Link from "next/link";
import { notFound } from "next/navigation";
import { getSparePartById, getLinkedAssetsForSparePart } from "@/services/spare-parts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SparePartDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [part, linkedAssets] = await Promise.all([
    getSparePartById(id),
    getLinkedAssetsForSparePart(id),
  ]);
  if (!part) notFound();

  const supplierName = (part.suppliers as { name?: string } | null)?.name ?? null;
  const isLowStock = part.current_stock <= part.reorder_level;

  return (
    <DashboardLayout title="Spare part">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/spare-parts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold">{part.part_name}</h2>
          {isLowStock && (
            <Badge variant="destructive">Low stock</Badge>
          )}
          {part.is_consumable && (
            <Badge variant="secondary">One-time use</Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">SKU:</span> {part.sku ?? "—"}</p>
              <p><span className="text-muted-foreground">Category:</span> {part.category ?? "—"}</p>
              <p><span className="text-muted-foreground">Brand / Model:</span> {[part.brand, part.model].filter(Boolean).join(" / ") || "—"}</p>
              <p><span className="text-muted-foreground">Supplier:</span> {supplierName ?? "—"}</p>
              <p><span className="text-muted-foreground">Unit price:</span> {part.unit_price != null ? Number(part.unit_price).toFixed(2) : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Current stock:</span> {part.current_stock}</p>
              <p><span className="text-muted-foreground">Minimum stock:</span> {part.minimum_stock}</p>
              <p><span className="text-muted-foreground">Reorder level:</span> {part.reorder_level}</p>
            </CardContent>
          </Card>
        </div>

        {linkedAssets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Device assets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {linkedAssets.map((asset) => (
                  <li key={asset.id}>
                    <Link href={`/assets/${asset.id}`} className="hover:underline font-medium">
                      {asset.asset_tag}
                    </Link>
                    {asset.serial_number && (
                      <span className="text-muted-foreground ml-2">SN: {asset.serial_number}</span>
                    )}
                    <span className="text-muted-foreground ml-2">{asset.device_type}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {part.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {part.notes}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
