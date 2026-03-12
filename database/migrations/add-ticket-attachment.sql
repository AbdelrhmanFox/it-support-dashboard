-- =============================================================================
-- Add optional attachment (screenshot) URL to tickets (public support form)
-- =============================================================================
-- Run in Supabase SQL Editor. Safe to run multiple times.

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Optional: Create Storage bucket "ticket-attachments" in Supabase Dashboard
-- (Storage > New bucket > ticket-attachments, set Public if you want direct URLs)
-- Then add policy: Allow anon INSERT (so the server can upload on behalf of public form)
