/**
 * Admin-editable lookup options (dropdown lists) by category.
 */
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type LookupOptionRow = Database["public"]["Tables"]["lookup_options"]["Row"];

export const LOOKUP_CATEGORIES = {
  asset_device_type: "Device types (assets)",
  asset_brand: "Brands (assets)",
  asset_department: "Departments (assets)",
  spare_part_category: "Categories (spare parts)",
  support_department: "Department (support form)",
  support_issue_type: "Issue type (support form)",
  support_priority: "Priority (support form)",
} as const;

export type LookupCategory = keyof typeof LOOKUP_CATEGORIES;

/** Labels only, sorted (for Select items). Global list only (branch_id null). */
export async function getLookupOptions(category: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lookup_options")
    .select("label, sort_order")
    .eq("category", category)
    .is("branch_id", null)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => r.label);
}

/** Full rows for admin UI. */
export async function getLookupOptionsFull(category: string): Promise<LookupOptionRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lookup_options")
    .select("*")
    .eq("category", category)
    .is("branch_id", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LookupOptionRow[];
}

export async function createLookupOption(input: {
  category: string;
  label: string;
  sort_order?: number;
}): Promise<LookupOptionRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lookup_options")
    .insert({
      category: input.category,
      label: input.label.trim(),
      sort_order: input.sort_order ?? 0,
      branch_id: null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LookupOptionRow;
}

export async function updateLookupOption(
  id: string,
  input: { label?: string; sort_order?: number }
): Promise<LookupOptionRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lookup_options")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as LookupOptionRow;
}

export async function deleteLookupOption(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("lookup_options").delete().eq("id", id);
  if (error) throw error;
}
