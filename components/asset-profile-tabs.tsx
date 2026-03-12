"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/services/assets";
import type { AssetHistoryEntry } from "@/services/asset-history";
import type { Ticket } from "@/services/tickets";
import type { AssetAttachment } from "@/services/asset-attachments";
import { ExternalLink, FileText, Wrench, Package, Paperclip } from "lucide-react";

interface AssetProfileTabsProps {
  asset: Asset;
  maintenanceHistory: AssetHistoryEntry[];
  ticketsLinked: Ticket[];
  attachments: AssetAttachment[];
}

export function AssetProfileTabs({
  asset,
  maintenanceHistory,
  ticketsLinked,
  attachments,
}: AssetProfileTabsProps) {
  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
    active: "success",
    in_maintenance: "warning",
    retired: "secondary",
    lost: "destructive",
    spare: "outline",
  };
  const installedParts = maintenanceHistory.filter((h) => h.installed_part_id != null);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
        <TabsTrigger value="parts">Installed Parts</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="attachments">Attachments</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
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
              {(asset.warranty_end || asset.warranty_start) && (
                <p><span className="text-muted-foreground">Warranty:</span> {[asset.warranty_start, asset.warranty_end].filter(Boolean).map((d) => d?.slice(0, 10)).join(" – ") || "—"}</p>
              )}
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
      </TabsContent>

      <TabsContent value="maintenance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance History
            </CardTitle>
            <CardDescription>All actions performed on this asset</CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance entries yet.</p>
            ) : (
              <ul className="space-y-3">
                {maintenanceHistory.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm">
                    <div>
                      <span className="font-medium">{h.action_type}</span>
                      {h.description && <span className="text-muted-foreground"> — {h.description}</span>}
                      {h.spare_parts?.part_name && (
                        <span className="ml-1 text-muted-foreground">(Part: {h.spare_parts.part_name})</span>
                      )}
                    </div>
                    <span className="text-muted-foreground">{new Date(h.performed_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Button variant="outline" asChild>
          <Link href={`/asset-history?assetId=${asset.id}`}>View all in Asset History</Link>
        </Button>
      </TabsContent>

      <TabsContent value="parts" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Installed Parts
            </CardTitle>
            <CardDescription>Parts installed on this asset (from maintenance history)</CardDescription>
          </CardHeader>
          <CardContent>
            {installedParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parts recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {installedParts.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <span>{h.spare_parts?.part_name ?? "Unknown part"}</span>
                    <span className="text-muted-foreground">{new Date(h.performed_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tickets" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Linked Tickets
            </CardTitle>
            <CardDescription>Tickets linked to this asset</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLinked.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets linked to this asset.</p>
            ) : (
              <ul className="space-y-2">
                {ticketsLinked.map((t) => (
                  <li key={t.id}>
                    <Link href={`/tickets/${t.id}`} className="flex items-center justify-between rounded border p-3 text-sm hover:bg-muted/50">
                      <span className="font-medium">{t.ticket_number}</span>
                      <Badge variant={statusVariants[t.status as string] ?? "secondary"}>{t.status}</Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attachments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Attachments
            </CardTitle>
            <CardDescription>Files and links for this asset</CardDescription>
          </CardHeader>
          <CardContent>
            {attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attachments yet. Add links or uploads from the dashboard when the feature is available.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary underline"
                    >
                      {a.file_name ?? "Attachment"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
