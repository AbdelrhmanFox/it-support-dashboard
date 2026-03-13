-- =============================================================================
-- LOOKUP_OPTIONS: admin-editable lists for forms (device type, brand, etc.)
-- =============================================================================
-- Global lists (branch_id NULL). Admins CRUD via app; all authenticated read.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lookup_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lookup_options_category ON public.lookup_options(category);
CREATE INDEX IF NOT EXISTS idx_lookup_options_branch ON public.lookup_options(branch_id);

-- Global: one label per category when branch_id is null
CREATE UNIQUE INDEX IF NOT EXISTS idx_lookup_options_category_label_global
  ON public.lookup_options(category, label)
  WHERE branch_id IS NULL;

ALTER TABLE public.lookup_options ENABLE ROW LEVEL SECURITY;

-- Read: everyone (forms need options)
DROP POLICY IF EXISTS "Allow anon read lookup_options" ON public.lookup_options;
CREATE POLICY "Allow anon read lookup_options" ON public.lookup_options FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated read lookup_options" ON public.lookup_options;
CREATE POLICY "Allow authenticated read lookup_options" ON public.lookup_options FOR SELECT TO authenticated USING (true);

-- Write: admin only (authenticated)
DROP POLICY IF EXISTS "Lookup options admin insert" ON public.lookup_options;
CREATE POLICY "Lookup options admin insert" ON public.lookup_options FOR INSERT TO authenticated
  WITH CHECK (public.current_user_is_admin());
DROP POLICY IF EXISTS "Lookup options admin update" ON public.lookup_options;
CREATE POLICY "Lookup options admin update" ON public.lookup_options FOR UPDATE TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
DROP POLICY IF EXISTS "Lookup options admin delete" ON public.lookup_options;
CREATE POLICY "Lookup options admin delete" ON public.lookup_options FOR DELETE TO authenticated
  USING (public.current_user_is_admin());

COMMENT ON TABLE public.lookup_options IS 'Admin-editable dropdown options by category (e.g. asset_device_type, asset_brand, asset_department).';

-- Seed defaults (global only). Idempotent.
INSERT INTO public.lookup_options (category, label, sort_order, branch_id)
SELECT v.category, v.label, v.sort_order, NULL
FROM (VALUES
  ('asset_device_type', 'Keyboard', 10),
  ('asset_device_type', 'Screen', 20),
  ('asset_device_type', 'Laptop', 30),
  ('asset_device_type', 'Printer', 40),
  ('asset_device_type', 'Monitor', 50),
  ('asset_device_type', 'Mouse', 60),
  ('asset_device_type', 'Cable', 70),
  ('asset_device_type', 'Desktop', 80),
  ('asset_device_type', 'Server', 90),
  ('asset_device_type', 'Other', 100),
  ('asset_brand', 'Dell', 10),
  ('asset_brand', 'HP', 20),
  ('asset_brand', 'Lenovo', 30),
  ('asset_brand', 'Apple', 40),
  ('asset_brand', 'Samsung', 50),
  ('asset_brand', 'Canon', 60),
  ('asset_brand', 'Epson', 70),
  ('asset_brand', 'Other', 100),
  ('asset_department', 'IT', 10),
  ('asset_department', 'HR', 20),
  ('asset_department', 'Finance', 30),
  ('asset_department', 'Operations', 40),
  ('asset_department', 'Production', 50),
  ('asset_department', 'Other', 100),
  ('spare_part_category', 'Other', 100)
) AS v(category, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lookup_options lo
  WHERE lo.category = v.category AND lo.label = v.label AND lo.branch_id IS NULL
);
