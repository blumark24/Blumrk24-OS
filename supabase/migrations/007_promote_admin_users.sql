-- ============================================================
-- Migration 007 — Promote admin users to super_admin
-- Run manually in Supabase Dashboard → SQL Editor
-- Safe to run multiple times (idempotent UPDATE)
-- ============================================================

-- Promote the primary admin account.
-- If force_password_change is still true for this user, set it false
-- so the role is immediately usable after the DB fix.
UPDATE public.profiles
SET
  role                 = 'super_admin',
  department           = 'الإدارة العليا',
  is_active            = true,
  force_password_change = false
WHERE email = 'j3b.ksa@gmail.com';

-- Verify the result — expected: 1 row with role = super_admin
SELECT id, email, role, is_active, force_password_change
FROM public.profiles
WHERE email = 'j3b.ksa@gmail.com';
