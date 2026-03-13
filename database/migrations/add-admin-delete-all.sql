-- =============================================================================
-- ADMIN DELETE ALL: explicit DELETE policy so admins can remove any row
-- (avoids edge cases where branch_id NULL or mismatched blocks delete)
-- =============================================================================
-- Run after add-multi-branch.sql. Idempotent DROP IF EXISTS + CREATE.

-- spare_parts
DROP POLICY IF EXISTS "Admin delete all spare_parts" ON public.spare_parts;
CREATE POLICY "Admin delete all spare_parts" ON public.spare_parts FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- assets
DROP POLICY IF EXISTS "Admin delete all assets" ON public.assets;
CREATE POLICY "Admin delete all assets" ON public.assets FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- suppliers
DROP POLICY IF EXISTS "Admin delete all suppliers" ON public.suppliers;
CREATE POLICY "Admin delete all suppliers" ON public.suppliers FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- stock_transactions
DROP POLICY IF EXISTS "Admin delete all stock_transactions" ON public.stock_transactions;
CREATE POLICY "Admin delete all stock_transactions" ON public.stock_transactions FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- purchase_requests
DROP POLICY IF EXISTS "Admin delete all purchase_requests" ON public.purchase_requests;
CREATE POLICY "Admin delete all purchase_requests" ON public.purchase_requests FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- tickets
DROP POLICY IF EXISTS "Admin delete all tickets" ON public.tickets;
CREATE POLICY "Admin delete all tickets" ON public.tickets FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- supplier_followups
DROP POLICY IF EXISTS "Admin delete all supplier_followups" ON public.supplier_followups;
CREATE POLICY "Admin delete all supplier_followups" ON public.supplier_followups FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- asset_history
DROP POLICY IF EXISTS "Admin delete all asset_history" ON public.asset_history;
CREATE POLICY "Admin delete all asset_history" ON public.asset_history FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- notifications
DROP POLICY IF EXISTS "Admin delete all notifications" ON public.notifications;
CREATE POLICY "Admin delete all notifications" ON public.notifications FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

-- spare_part_assets (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spare_part_assets') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admin delete all spare_part_assets" ON public.spare_part_assets';
    EXECUTE 'CREATE POLICY "Admin delete all spare_part_assets" ON public.spare_part_assets FOR DELETE TO authenticated USING (public.current_user_is_admin())';
  END IF;
END $$;
