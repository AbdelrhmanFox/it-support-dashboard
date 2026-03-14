"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStockTransactions, deleteStockTransaction, reverseUseSparePartOnAsset, type StockTransaction } from "@/services/stock-transactions";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonRow } from "@/components/ui/skeleton-row";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export default function InventoryPage() {
  const { effectiveBranchId, isAdmin, canEdit } = useBranch();
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof getStockTransactions>>>([]);
  const [parts, setParts] = useState<Awaited<ReturnType<typeof getSpareParts>>>([]);
  const [loading, setLoading] = useState(true);
  const [partFilter, setPartFilter] = useState<string>("all");
  const [undoTarget, setUndoTarget] = useState<StockTransaction | null>(null);
  const [undoLoading, setUndoLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StockTransaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
                    {(isAdmin || canEdit) && <TableHead className="w-[120px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonRow columns={(isAdmin || canEdit) ? 7 : 6} rows={5} />
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(isAdmin || canEdit) ? 7 : 6}>
                        <EmptyState
                          title="No transactions found"
                          description="Stock transactions will appear here."
                        />
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
                          <StatusBadge value={t.transaction_type} />
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
                        {(isAdmin || canEdit) && (
                          <TableCell className="space-x-1">
                            {t.transaction_type === "OUT" && t.related_asset_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUndoTarget(t)}
                              >
                                Undo use
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(t)}
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

      <ConfirmDialog
        open={!!undoTarget}
        onOpenChange={(open) => !open && setUndoTarget(null)}
        title="Undo use"
        description="Undo this use? Stock will be restored and the asset history entry will be removed."
        confirmLabel="Undo"
        variant="default"
        loading={undoLoading}
        onConfirm={async () => {
          if (!undoTarget) return;
          setUndoLoading(true);
          try {
            await reverseUseSparePartOnAsset(undoTarget.id);
            load();
            setUndoTarget(null);
            toast.success("Use undone");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : String(e));
          } finally {
            setUndoLoading(false);
          }
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete transaction"
        description="Delete this stock transaction? Stock totals will not auto-adjust; use a correcting IN/OUT if needed."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleteLoading(true);
          try {
            await deleteStockTransaction(deleteTarget.id);
            load();
            setDeleteTarget(null);
            toast.success("Transaction deleted");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : String(e));
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
