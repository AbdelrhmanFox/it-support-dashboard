/**
 * Asset attachments (file URLs per asset). Requires asset_attachments table.
 */
import { createClient } from "@/lib/supabase/client";

export interface AssetAttachment {
  id: string;
  asset_id: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
}

export async function getAssetAttachments(assetId: string): Promise<AssetAttachment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("asset_attachments")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as AssetAttachment[];
}

export async function addAssetAttachment(
  assetId: string,
  fileUrl: string,
  fileName?: string | null
): Promise<AssetAttachment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("asset_attachments")
    .insert({ asset_id: assetId, file_url: fileUrl, file_name: fileName ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as AssetAttachment;
}

export async function deleteAssetAttachment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("asset_attachments").delete().eq("id", id);
  if (error) throw error;
}
