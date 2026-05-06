-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run (DROP IF EXISTS before every CREATE)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. FIX PROFILES UPDATE — prevent any user from escalating
--    their own role via a direct DB update.
--
--    BEFORE: auth.uid() = id  ← any user could UPDATE profiles
--            SET role = 'super_admin' WHERE id = auth.uid()
--    AFTER:  only super_admin / known admin emails can UPDATE
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: update"      ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"  ON public.profiles;

CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 2. FIX TASKS WRITE — restrict to managers/admins + assignee.
--
--    BEFORE: any authenticated user could delete/modify
--            ANY task row in the entire system.
--    AFTER:  super_admin / managers can do anything;
--            regular users can only INSERT their own tasks
--            or UPDATE the status of tasks assigned to them.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks: write"               ON public.tasks;
DROP POLICY IF EXISTS "tasks: authenticated write" ON public.tasks;

-- Admins and managers: full write access
CREATE POLICY "tasks: admin write"
  ON public.tasks FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','defense_manager','attack_manager','finance_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- Regular employees: can only INSERT new tasks assigned to themselves
-- and UPDATE tasks where they are the assignee (e.g., change status)
CREATE POLICY "tasks: employee write"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'employee'
    AND assignee_id = auth.uid()::text
  );

CREATE POLICY "tasks: employee update own"
  ON public.tasks FOR UPDATE
  USING (
    public.get_my_role() = 'employee'
    AND assignee_id = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────
-- 3. TIGHTEN TRANSACTIONS WRITE — finance managers + admins only
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "transactions: write"          ON public.transactions;
DROP POLICY IF EXISTS "transactions: finance write"  ON public.transactions;

CREATE POLICY "transactions: write"
  ON public.transactions FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','finance_manager','board_member')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 4. TIGHTEN EMPLOYEES WRITE — verify existing policy is strict
--    (reproduced here to ensure it is applied)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "employees: write" ON public.employees;

CREATE POLICY "employees: write"
  ON public.employees FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','defense_manager','attack_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 5. LOCK automation_logs — authenticated users can read,
--    only service role / admin can insert
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_logs: read"  ON public.automation_logs;
DROP POLICY IF EXISTS "automation_logs: write" ON public.automation_logs;

CREATE POLICY "automation_logs: read"
  ON public.automation_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "automation_logs: write"
  ON public.automation_logs FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 6. LOCK system_settings — admin only
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings: read"  ON public.system_settings;
DROP POLICY IF EXISTS "system_settings: write" ON public.system_settings;

CREATE POLICY "system_settings: read"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "system_settings: write"
  ON public.system_settings FOR ALL
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 7. CONFIRM strategy_phases sort_order column exists
--    (idempotent — harmless if already applied)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.strategy_phases
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE public.strategy_phases
SET sort_order = id
WHERE sort_order = 0;
