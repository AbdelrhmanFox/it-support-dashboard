-- =============================================================================
-- Assign a support user to a branch (required for RLS: support users can only
-- create/edit records when their profile has branch_id set)
-- =============================================================================
-- 1. Get your support user id from: Authentication → Users → click user → copy "User UID"
-- 2. Get branch id from: Table Editor → branches (e.g. ICAPP = f223773c-09a6-4be8-8ed5-988770f2c14a)
-- 3. Replace SUPPORT_USER_ID and BRANCH_ID below, then run in SQL Editor.

UPDATE public.profiles
SET branch_id = 'BRANCH_ID'   -- e.g. 'f223773c-09a6-4be8-8ed5-988770f2c14a' for ICAPP
WHERE id = 'SUPPORT_USER_ID'; -- auth.users.id of the support user

-- Example for ICAPP branch:
-- UPDATE public.profiles SET branch_id = 'f223773c-09a6-4be8-8ed5-988770f2c14a' WHERE id = 'your-support-user-uuid-here';
