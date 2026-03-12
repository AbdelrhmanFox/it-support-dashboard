"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssetHistory } from "@/services/asset-history";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAssets } from "@/services/assets";

export default function AssetHistoryPage() {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getAssetHistory>>>([]);
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof getAssets>>>([]);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    try {
      const [h, a] = await Promise.all([
        getAssetHistory({ assetId: assetFilter === "all" ? undefined : assetFilter, limit: 100 }),
        getAssets(),
      ]);
      setHistory(h);
      setAssets(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [assetFilter]);

  return (
    <DashboardLayout title="Asset History">
      <Card>
        <CardHeader>
          <CardTitle>Maintenance history</CardTitle>
          <CardDescription>Actions performed on IT assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={assetFilter} onValueChange={setAssetFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filter by asset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assets</SelectItem>
              {assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.asset_tag} — {a.device_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Part installed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No history entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(entry.performed_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/assets/${entry.asset_id}`} className="hover:underline">
                            {assets.find((a) => a.id === entry.asset_id)?.asset_tag ?? entry.asset_id}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{entry.action_type}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                          {entry.description ?? "—"}
                        </TableCell>
                        <TableCell>
                          {(entry.spare_parts as { part_name?: string })?.part_name ?? "—"}
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
    </DashboardLayout>
  );
}
