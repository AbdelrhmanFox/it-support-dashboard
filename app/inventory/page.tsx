"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStockTransactions } from "@/services/stock-transactions";
import { getSpareParts } from "@/services/spare-parts";
import { useBranch } from "@/components/branch-provider";
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
import { Badge } from "@/components/ui/badge";

export default function InventoryPage() {
  const { effectiveBranchId } = useBranch();
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getStockTransactions>>>([]);
  const [parts, setParts] = useState<Awaited<ReturnType<typeof getSpareParts>>>([]);
  const [loading, setLoading] = useState(true);
  const [partFilter, setPartFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    try {
      const [txs, p] = await Promise.all([
        getStockTransactions({
          partId: partFilter === "all" ? undefined : partFilter,
          limit: 100,
          branchId: effectiveBranchId ?? undefined,
        }),
        getSpareParts({ branchId: effectiveBranchId ?? undefined }),
      ]);
      setTransactions(txs);
      setParts(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [partFilter, effectiveBranchId]);

  return (
    <DashboardLayout title="Inventory">
      <Card>
        <CardHeader>
          <CardTitle>Stock transactions</CardTitle>
          <CardDescription>IN/OUT movements for spare parts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={partFilter} onValueChange={setPartFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filter by part" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All parts</SelectItem>
              {parts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.part_name} {p.sku ? `(${p.sku})` : ""}
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
                    <TableHead>Part</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Related asset</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(t.transaction_date).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/spare-parts/${t.spare_part_id}`} className="hover:underline">
                            {(t.spare_parts as { part_name?: string })?.part_name ?? t.spare_part_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.transaction_type === "IN" ? "success" : "secondary"}>
                            {t.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{t.quantity}</TableCell>
                        <TableCell>
                          {t.related_asset_id
                            ? (t.assets as { asset_tag?: string })?.asset_tag ?? t.related_asset_id
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {t.notes ?? "—"}
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
      <Card>
        <CardHeader>
          <CardTitle>Current stock overview</CardTitle>
          <CardDescription>Spare parts and reorder levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Reorder level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((p) => {
                  const isLow = p.current_stock <= p.reorder_level;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/spare-parts/${p.id}`} className="hover:underline">
                          {p.part_name}
                        </Link>
                      </TableCell>
                      <TableCell>{p.sku ?? "—"}</TableCell>
                      <TableCell className="text-right">{p.current_stock}</TableCell>
                      <TableCell className="text-right">{p.reorder_level}</TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive">Low stock</Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
