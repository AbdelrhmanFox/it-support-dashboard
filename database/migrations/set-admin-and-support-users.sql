-- =============================================================================
-- Set roles: icapp = Support (ICAPP only), abdelrhman = Admin (all branches)
-- Run once in Supabase SQL Editor.
-- =============================================================================

-- ICAPP branch id (from your branches table; adjust if your ICAPP id is different)
-- You can check: SELECT id, code FROM public.branches WHERE code = 'ICAPP';

-- 1) icapp@icapp.com.eg → Support, ICAPP branch only
UPDATE public.profiles
SET role = 'support',
    branch_id = (SELECT id FROM public.branches WHERE code = 'ICAPP' LIMIT 1)
WHERE id = (SELECT id FROM auth.users WHERE email = 'icapp@icapp.com.eg');

-- 2) abdelrhmanahmedz253@gmail.com → Admin, all branches
UPDATE public.profiles
SET role = 'admin',
    branch_id = NULL
WHERE id = (SELECT id FROM auth.users WHERE email = 'abdelrhmanahmedz253@gmail.com');
