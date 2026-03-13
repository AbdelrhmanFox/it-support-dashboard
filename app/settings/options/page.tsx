"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useBranch } from "@/components/branch-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LOOKUP_CATEGORIES,
  getLookupOptionsFull,
  createLookupOption,
  updateLookupOption,
  deleteLookupOption,
  type LookupOptionRow,
} from "@/services/lookup-options";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function SettingsOptionsPage() {
  const { isAdmin } = useBranch();
  const [category, setCategory] = useState<string>("asset_device_type");
  const [rows, setRows] = useState<LookupOptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLookupOptionsFull(category);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [category, isAdmin]);

  async function handleAdd() {
    if (!newLabel.trim()) return;
    setError(null);
    try {
      await createLookupOption({ category, label: newLabel.trim(), sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 10 });
      setNewLabel("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this option? Existing records using this value keep the text; only the dropdown list changes.")) return;
    setError(null);
    try {
      await deleteLookupOption(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSortChange(id: string, sort_order: number) {
    try {
      await updateLookupOption(id, { sort_order });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (!isAdmin) {
    return (
      <DashboardLayout title="Lists">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Admin only</CardTitle>
            <CardDescription>Only administrators can edit dropdown lists.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lists (admin)">
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Dropdown lists</CardTitle>
            <CardDescription>
              Manage options for Device type, Brand, and Department on the Add asset form. Changes apply app-wide after refresh.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>List</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(LOOKUP_CATEGORIES).map(([key, title]) => (
                  <option key={key} value={key}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 rounded-md border p-2">
                    <Input
                      className="w-20"
                      type="number"
                      defaultValue={r.sort_order}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v !== r.sort_order) handleSortChange(r.id, v);
                      }}
                    />
                    <span className="flex-1 font-medium">{r.label}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(r.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="New option label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
              />
              <Button type="button" onClick={handleAdd} disabled={!newLabel.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
