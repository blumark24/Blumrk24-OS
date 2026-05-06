-- ============================================================
-- MIGRATION 003: messages isolation + permissions persistence
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. MESSAGES — restrict DELETE/UPDATE to own messages only.
--    Any authenticated user can INSERT (internal messaging).
--    Only super_admin can DELETE any message.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages: read"  ON public.messages;
DROP POLICY IF EXISTS "messages: write" ON public.messages;
DROP POLICY IF EXISTS "messages: authenticated read"  ON public.messages;
DROP POLICY IF EXISTS "messages: authenticated write" ON public.messages;

CREATE POLICY "messages: read"
  ON public.messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "messages: insert"
  ON public.messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "messages: update"
  ON public.messages FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "messages: delete"
  ON public.messages FOR DELETE
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 2. ROLE_PERMISSIONS — new table to persist RBAC config.
--    super_admin can read/write; all authenticated can read.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role        TEXT PRIMARY KEY,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions: read"  ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions: write" ON public.role_permissions;

CREATE POLICY "role_permissions: read"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions: write"
  ON public.role_permissions FOR ALL
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- Seed default permissions (safe to re-run)
INSERT INTO public.role_permissions (role, permissions) VALUES
  ('super_admin',     ARRAY['view_dashboard','manage_board','manage_users','manage_roles','manage_tasks','manage_clients','manage_finance','manage_reports','manage_settings','manage_automations']),
  ('board_member',    ARRAY['view_dashboard','manage_board','manage_reports','manage_finance']),
  ('defense_manager', ARRAY['view_dashboard','manage_board','manage_users','manage_tasks','manage_reports','manage_automations']),
  ('attack_manager',  ARRAY['view_dashboard','manage_clients','manage_tasks','manage_reports']),
  ('finance_manager', ARRAY['view_dashboard','manage_finance','manage_reports']),
  ('employee',        ARRAY['view_dashboard','manage_tasks'])
ON CONFLICT (role) DO NOTHING;
