-- Add is_consumable to spare_parts (one-time use / consumable flag)
ALTER TABLE spare_parts
ADD COLUMN IF NOT EXISTS is_consumable BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN spare_parts.is_consumable IS 'True if part is one-time use / consumable (e.g. ink, cable).';
