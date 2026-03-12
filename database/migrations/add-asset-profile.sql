-- =============================================================================
-- Asset profile: optional asset_id on tickets, asset_attachments table
-- =============================================================================
-- Run in Supabase SQL Editor. Safe to run multiple times.

-- Link tickets to an asset (optional)
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_asset ON public.tickets(asset_id) WHERE asset_id IS NOT NULL;

-- Attachments per asset (file URL from Storage or external)
CREATE TABLE IF NOT EXISTS public.asset_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_asset_attachments_asset ON public.asset_attachments(asset_id);

ALTER TABLE public.asset_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read asset_attachments" ON public.asset_attachments;
DROP POLICY IF EXISTS "Allow anon insert asset_attachments" ON public.asset_attachments;
DROP POLICY IF EXISTS "Allow anon update asset_attachments" ON public.asset_attachments;
DROP POLICY IF EXISTS "Allow anon delete asset_attachments" ON public.asset_attachments;
CREATE POLICY "Allow anon read asset_attachments" ON public.asset_attachments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert asset_attachments" ON public.asset_attachments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update asset_attachments" ON public.asset_attachments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete asset_attachments" ON public.asset_attachments FOR DELETE TO anon USING (true);
