-- =============================================================================
-- IT Support Operations Dashboard - Supabase (PostgreSQL) Schema
-- =============================================================================
-- Run this script in the Supabase SQL Editor to create all tables, indexes,
-- and constraints. Auth is handled by Supabase Auth (auth.users).
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES (extends auth.users for app-specific user data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'it_support', 'viewer', 'requester')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =============================================================================
-- SUPPLIERS (must exist before spare_parts and purchase_requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  sla_days INTEGER DEFAULT 7,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON public.suppliers(name);

-- =============================================================================
-- SPARE PARTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model TEXT,
  compatible_devices TEXT,
  sku TEXT UNIQUE,
  unit_price DECIMAL(12, 2) DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spare_parts_category ON public.spare_parts(category);
CREATE INDEX idx_spare_parts_supplier ON public.spare_parts(supplier_id);
CREATE INDEX idx_spare_parts_sku ON public.spare_parts(sku);
CREATE INDEX idx_spare_parts_low_stock ON public.spare_parts(current_stock) WHERE current_stock <= reorder_level;

-- =============================================================================
-- ASSETS (IT devices)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_tag TEXT UNIQUE NOT NULL,
  serial_number TEXT,
  device_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_start DATE,
  warranty_end DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_maintenance', 'retired', 'lost', 'spare')),
  assigned_user_name TEXT,
  assigned_user_email TEXT,
  department TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_asset_tag ON public.assets(asset_tag);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_department ON public.assets(department);
CREATE INDEX idx_assets_device_type ON public.assets(device_type);

-- =============================================================================
-- STOCK TRANSACTIONS (inventory movements)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spare_part_id UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  performed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_transactions_part ON public.stock_transactions(spare_part_id);
CREATE INDEX idx_stock_transactions_date ON public.stock_transactions(transaction_date);
CREATE INDEX idx_stock_transactions_asset ON public.stock_transactions(related_asset_id);

-- =============================================================================
-- PURCHASE REQUESTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT UNIQUE NOT NULL,
  spare_part_id UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  requested_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'ordered', 'waiting_supplier', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX idx_purchase_requests_supplier ON public.purchase_requests(supplier_id);
CREATE INDEX idx_purchase_requests_expected ON public.purchase_requests(expected_delivery_date) WHERE status NOT IN ('delivered', 'cancelled');

-- =============================================================================
-- SUPPLIER FOLLOW-UPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.supplier_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  purchase_request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  last_contact_date DATE,
  next_followup_date DATE,
  status TEXT DEFAULT 'pending',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_followups_supplier ON public.supplier_followups(supplier_id);
CREATE INDEX idx_supplier_followups_next ON public.supplier_followups(next_followup_date);

-- =============================================================================
-- ASSET HISTORY (maintenance log per asset)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.asset_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  installed_part_id UUID REFERENCES public.spare_parts(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  performed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_history_asset ON public.asset_history(asset_id);
CREATE INDEX idx_asset_history_performed_at ON public.asset_history(performed_at);

-- =============================================================================
-- TICKETS (internal support requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  requester_name TEXT NOT NULL,
  employee_id TEXT,
  email TEXT NOT NULL,
  department TEXT,
  issue_type TEXT,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attachment_url TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_created ON public.tickets(created_at);
CREATE INDEX idx_tickets_issue_type ON public.tickets(issue_type);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  module TEXT,
  related_record_id UUID,
  related_record_type TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - enable and add policies as needed
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Example: allow authenticated users to read all (adjust per role in production)
CREATE POLICY "Allow read for authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.spare_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.stock_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.purchase_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.supplier_followups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.asset_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow insert/update/delete for authenticated (refine with role checks in production)
CREATE POLICY "Allow all for authenticated" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.spare_parts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.stock_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.purchase_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.supplier_followups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.asset_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- TRIGGER: update updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run these once. If re-running schema, drop triggers first if needed.
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_spare_parts_updated_at BEFORE UPDATE ON public.spare_parts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_supplier_followups_updated_at BEFORE UPDATE ON public.supplier_followups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- HELPER: generate next request number / ticket number (optional, can be done in app)
-- =============================================================================
-- Example: SELECT 'PR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((COUNT(*) + 1)::TEXT, 4, '0') FROM purchase_requests WHERE request_date = CURRENT_DATE;
