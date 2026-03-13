-- Link spare parts to assets (which assets this part can be used for)
CREATE TABLE IF NOT EXISTS spare_part_assets (
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (spare_part_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_spare_part_assets_asset_id ON spare_part_assets(asset_id);

ALTER TABLE spare_part_assets ENABLE ROW LEVEL SECURITY;

-- RLS: same as spare_parts (admin or branch match)
CREATE POLICY "Allow anon read spare_part_assets" ON spare_part_assets FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert spare_part_assets" ON spare_part_assets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon delete spare_part_assets" ON spare_part_assets FOR DELETE TO anon USING (true);
CREATE POLICY "Spare_part_assets branch or admin" ON spare_part_assets FOR ALL TO authenticated
  USING (
    public.current_user_is_admin()
    OR EXISTS (SELECT 1 FROM spare_parts sp WHERE sp.id = spare_part_assets.spare_part_id AND sp.branch_id = public.current_user_branch_id())
  )
  WITH CHECK (
    public.current_user_is_admin()
    OR EXISTS (SELECT 1 FROM spare_parts sp WHERE sp.id = spare_part_assets.spare_part_id AND sp.branch_id = public.current_user_branch_id())
  );

COMMENT ON TABLE spare_part_assets IS 'Junction: which assets a spare part can be used for.';
