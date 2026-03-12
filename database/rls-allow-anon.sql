-- =============================================================================
-- Fix RLS: Allow anon role to use the app without signing in
-- =============================================================================
-- Run this in Supabase SQL Editor if you get "new row violates row-level security"
-- The app uses the anon key and does not require login yet.
-- Safe to run multiple times (drops existing anon policies before creating).
-- =============================================================================

-- Suppliers
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon delete suppliers" ON public.suppliers;
CREATE POLICY "Allow anon read suppliers" ON public.suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert suppliers" ON public.suppliers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update suppliers" ON public.suppliers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete suppliers" ON public.suppliers FOR DELETE TO anon USING (true);

-- Spare parts
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon read spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon insert spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon update spare_parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Allow anon delete spare_parts" ON public.spare_parts;
CREATE POLICY "Allow anon read spare_parts" ON public.spare_parts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert spare_parts" ON public.spare_parts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update spare_parts" ON public.spare_parts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete spare_parts" ON public.spare_parts FOR DELETE TO anon USING (true);

-- Assets
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.assets;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.assets;
DROP POLICY IF EXISTS "Allow anon read assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon insert assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon update assets" ON public.assets;
DROP POLICY IF EXISTS "Allow anon delete assets" ON public.assets;
CREATE POLICY "Allow anon read assets" ON public.assets FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert assets" ON public.assets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update assets" ON public.assets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete assets" ON public.assets FOR DELETE TO anon USING (true);

-- Stock transactions
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon read stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon insert stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon update stock_transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Allow anon delete stock_transactions" ON public.stock_transactions;
CREATE POLICY "Allow anon read stock_transactions" ON public.stock_transactions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert stock_transactions" ON public.stock_transactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update stock_transactions" ON public.stock_transactions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete stock_transactions" ON public.stock_transactions FOR DELETE TO anon USING (true);

-- Purchase requests
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon read purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon insert purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon update purchase_requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow anon delete purchase_requests" ON public.purchase_requests;
CREATE POLICY "Allow anon read purchase_requests" ON public.purchase_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert purchase_requests" ON public.purchase_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update purchase_requests" ON public.purchase_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete purchase_requests" ON public.purchase_requests FOR DELETE TO anon USING (true);

-- Supplier followups
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon read supplier_followups" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon insert supplier_followups" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon update supplier_followups" ON public.supplier_followups;
DROP POLICY IF EXISTS "Allow anon delete supplier_followups" ON public.supplier_followups;
CREATE POLICY "Allow anon read supplier_followups" ON public.supplier_followups FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert supplier_followups" ON public.supplier_followups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update supplier_followups" ON public.supplier_followups FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete supplier_followups" ON public.supplier_followups FOR DELETE TO anon USING (true);

-- Asset history
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.asset_history;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon read asset_history" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon insert asset_history" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon update asset_history" ON public.asset_history;
DROP POLICY IF EXISTS "Allow anon delete asset_history" ON public.asset_history;
CREATE POLICY "Allow anon read asset_history" ON public.asset_history FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert asset_history" ON public.asset_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update asset_history" ON public.asset_history FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete asset_history" ON public.asset_history FOR DELETE TO anon USING (true);

-- Tickets
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.tickets;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow anon delete tickets" ON public.tickets;
CREATE POLICY "Allow anon read tickets" ON public.tickets FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tickets" ON public.tickets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tickets" ON public.tickets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete tickets" ON public.tickets FOR DELETE TO anon USING (true);

-- Notifications
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.notifications;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow anon delete notifications" ON public.notifications;
CREATE POLICY "Allow anon read notifications" ON public.notifications FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert notifications" ON public.notifications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update notifications" ON public.notifications FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete notifications" ON public.notifications FOR DELETE TO anon USING (true);

-- Profiles
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon all profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles" ON public.profiles FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon all profiles" ON public.profiles FOR ALL TO anon USING (true) WITH CHECK (true);
