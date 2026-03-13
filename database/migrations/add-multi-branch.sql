-- =============================================================================
-- MULTI-BRANCH: branches table + branch_id on all operational tables + RLS
-- =============================================================================
-- Run in Supabase SQL Editor after schema.sql. Safe to run once; re-run may need
-- to drop policies. For existing data: creates default branch and assigns it.
-- =============================================================================

-- 1. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches(code);

-- Seed default branches (ignore if already exist)
INSERT INTO public.branches (name, code, location) VALUES
  ('ICAPP', 'ICAPP', NULL),
  ('FARMFRITES', 'FARMFRITES', NULL),
  ('FACTORY-A', 'FACTORY-A', NULL)
ON CONFLICT (code) DO NOTHING;

-- 2. PROFILES: add branch_id and role (admin | support | viewer)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
-- Map legacy roles to new ones before changing constraint
UPDATE public.profiles SET role = 'support' WHERE role = 'it_support';
UPDATE public.profiles SET role = 'viewer' WHERE role = 'requester';
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'support', 'viewer'));
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch_id);

-- 3. SUPPLIERS
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_suppliers_branch ON public.suppliers(branch_id);

-- 4. SPARE_PARTS
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_spare_parts_branch ON public.spare_parts(branch_id);

-- 5. ASSETS
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assets_branch ON public.assets(branch_id);

-- 6. STOCK_TRANSACTIONS
ALTER TABLE public.stock_transactions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stock_transactions_branch ON public.stock_transactions(branch_id);

-- 7. PURCHASE_REQUESTS
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_purchase_requests_branch ON public.purchase_requests(branch_id);

-- 8. SUPPLIER_FOLLOWUPS
ALTER TABLE public.supplier_followups ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_supplier_followups_branch ON public.supplier_followups(branch_id);

-- 9. ASSET_HISTORY (branch from asset; add for RLS clarity)
ALTER TABLE public.asset_history ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_asset_history_branch ON public.asset_history(branch_id);

-- 10. TICKETS
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tickets_branch ON public.tickets(branch_id);

-- 11. NOTIFICATIONS
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_branch ON public.notifications(branch_id);

-- 12. ASSET_ATTACHMENTS: no branch_id (scoped via asset); leave as is.

-- =============================================================================
-- BACKFILL: set first branch for existing rows (run once)
-- =============================================================================
DO $$
DECLARE
  default_branch_id UUID;
BEGIN
  SELECT id INTO default_branch_id FROM public.branches ORDER BY code LIMIT 1;
  IF default_branch_id IS NOT NULL THEN
    UPDATE public.suppliers SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.spare_parts SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.assets SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.stock_transactions SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.purchase_requests SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.supplier_followups SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.asset_history ah SET branch_id = a.branch_id FROM public.assets a WHERE ah.asset_id = a.id AND ah.branch_id IS NULL;
    UPDATE public.tickets SET branch_id = default_branch_id WHERE branch_id IS NULL;
    UPDATE public.notifications SET branch_id = default_branch_id WHERE branch_id IS NULL;
  END IF;
END $$;

-- =============================================================================
-- RLS: branch-aware (authenticated) + anon for public ticket insert
-- =============================================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Branches: everyone can read
DROP POLICY IF EXISTS "Allow read branches" ON public.branches;
CREATE POLICY "Allow read branches" ON public.branches FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow read branches authenticated" ON public.branches;
CREATE POLICY "Allow read branches authenticated" ON public.branches FOR SELECT TO authenticated USING (true);

-- Helper: admin sees all, support/viewer see only their branch
-- Using a security definer function to get current user's branch_id and role
CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policy pattern: SELECT/ALL where (is_admin OR branch_id = current_user_branch_id())
-- We keep anon policies for backward compatibility; add authenticated branch-scoped policies

-- Suppliers: authenticated branch-scoped; anon read/insert for backward compat
DROP POLICY IF EXISTS "Allow anon read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon delete suppliers" ON public.suppliers;
CREATE POLICY "Allow anon read suppliers" ON public.suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert suppliers" ON public.suppliers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update suppliers" ON public.suppliers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete suppliers" ON public.suppliers FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Suppliers branch or admin" ON public.suppliers;
CREATE POLICY "Suppliers branch or admin" ON public.suppliers FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

-- Same pattern for other tables (spare_parts, assets, stock_transactions, purchase_requests,
-- supplier_followups, asset_history, tickets, notifications)
-- Tickets: anon INSERT for public form (with branch_id in payload)
DROP POLICY IF EXISTS "Allow anon read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon delete tickets" ON public.tickets;
CREATE POLICY "Allow anon insert tickets" ON public.tickets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon read tickets" ON public.tickets FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update tickets" ON public.tickets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete tickets" ON public.tickets FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Tickets branch or admin" ON public.tickets;
CREATE POLICY "Tickets branch or admin" ON public.tickets FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

-- Spare parts
DROP POLICY IF EXISTS "Allow anon read spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon insert spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon update spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon delete spare_parts" ON public.spare_parts;
CREATE POLICY "Allow anon read spare_parts" ON public.spare_parts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert spare_parts" ON public.spare_parts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update spare_parts" ON public.spare_parts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete spare_parts" ON public.spare_parts FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Spare_parts branch or admin" ON public.spare_parts;
CREATE POLICY "Spare_parts branch or admin" ON public.spare_parts FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

-- Assets
DROP POLICY IF EXISTS "Allow anon read assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon insert assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon update assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon delete assets" ON public.assets;
CREATE POLICY "Allow anon read assets" ON public.assets FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert assets" ON public.assets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update assets" ON public.assets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete assets" ON public.assets FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Assets branch or admin" ON public.assets;
CREATE POLICY "Assets branch or admin" ON public.assets FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

-- Stock transactions, purchase_requests, supplier_followups, asset_history, notifications
-- (abbreviated: same pattern - anon full access for backward compat, authenticated branch or admin)
DROP POLICY IF EXISTS "Allow anon read stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon insert stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon update stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon delete stock_transactions" ON public.stock_transactions;
CREATE POLICY "Allow anon read stock_transactions" ON public.stock_transactions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert stock_transactions" ON public.stock_transactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update stock_transactions" ON public.stock_transactions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete stock_transactions" ON public.stock_transactions FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Stock_transactions branch or admin" ON public.stock_transactions;
CREATE POLICY "Stock_transactions branch or admin" ON public.stock_transactions FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

DROP POLICY IF EXISTS "Allow anon read purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon insert purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon update purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon delete purchase_requests" ON public.purchase_requests;
CREATE POLICY "Allow anon read purchase_requests" ON public.purchase_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert purchase_requests" ON public.purchase_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update purchase_requests" ON public.purchase_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete purchase_requests" ON public.purchase_requests FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Purchase_requests branch or admin" ON public.purchase_requests;
CREATE POLICY "Purchase_requests branch or admin" ON public.purchase_requests FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

DROP POLICY IF EXISTS "Allow anon read supplier_followups" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon insert supplier_followups" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon update supplier_followups" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon delete supplier_followups" ON public.supplier_followups;
CREATE POLICY "Allow anon read supplier_followups" ON public.supplier_followups FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert supplier_followups" ON public.supplier_followups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update supplier_followups" ON public.supplier_followups FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete supplier_followups" ON public.supplier_followups FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Supplier_followups branch or admin" ON public.supplier_followups;
CREATE POLICY "Supplier_followups branch or admin" ON public.supplier_followups FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

DROP POLICY IF EXISTS "Allow anon read asset_history" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon insert asset_history" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon update asset_history" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon delete asset_history" ON public.asset_history;
CREATE POLICY "Allow anon read asset_history" ON public.asset_history FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert asset_history" ON public.asset_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update asset_history" ON public.asset_history FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete asset_history" ON public.asset_history FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Asset_history branch or admin" ON public.asset_history;
CREATE POLICY "Asset_history branch or admin" ON public.asset_history FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

DROP POLICY IF EXISTS "Allow anon read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon delete notifications" ON public.notifications;
CREATE POLICY "Allow anon read notifications" ON public.notifications FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert notifications" ON public.notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update notifications" ON public.notifications FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete notifications" ON public.notifications FOR DELETE TO anon USING (true);
DROP POLICY IF EXISTS "Notifications branch or admin" ON public.notifications;
CREATE POLICY "Notifications branch or admin" ON public.notifications FOR ALL TO authenticated
  USING (public.current_user_is_admin() OR branch_id = public.current_user_branch_id())
  WITH CHECK (public.current_user_is_admin() OR branch_id = public.current_user_branch_id());

-- Profiles: users can read own profile; admin can read all
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.profiles;
CREATE POLICY "Profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles admin all" ON public.profiles FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (true);
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
