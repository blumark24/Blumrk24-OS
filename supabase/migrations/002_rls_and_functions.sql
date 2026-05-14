-- 002_rls_and_functions.sql
-- Row Level Security and helper functions for Blumark24-OS
-- Role source: public.profiles.role where profiles.id = auth.uid().

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'employee')
  FROM public.profiles
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = required_role
    OR public.current_user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'admin', 'manager');
$$;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.strategy_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
USING (public.is_manager_or_admin() OR id = auth.uid());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_delete ON public.profiles;
CREATE POLICY profiles_delete ON public.profiles FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS employees_select_policy ON public.employees;
CREATE POLICY employees_select_policy ON public.employees FOR SELECT
USING (public.is_manager_or_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS employees_insert_policy ON public.employees;
CREATE POLICY employees_insert_policy ON public.employees FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS employees_update_policy ON public.employees;
CREATE POLICY employees_update_policy ON public.employees FOR UPDATE
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS employees_delete_policy ON public.employees;
CREATE POLICY employees_delete_policy ON public.employees FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS tasks_select_policy ON public.tasks;
CREATE POLICY tasks_select_policy ON public.tasks FOR SELECT
USING (
  public.is_manager_or_admin()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
  OR (assigned_employee_id IS NOT NULL AND assigned_employee_id = (SELECT id FROM public.employees WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS tasks_insert_policy ON public.tasks;
CREATE POLICY tasks_insert_policy ON public.tasks FOR INSERT
WITH CHECK (public.is_manager_or_admin() OR created_by = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS tasks_update_policy ON public.tasks;
CREATE POLICY tasks_update_policy ON public.tasks FOR UPDATE
USING (public.is_manager_or_admin() OR assigned_to = auth.uid() OR created_by = auth.uid())
WITH CHECK (public.is_manager_or_admin() OR assigned_to = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS tasks_delete_policy ON public.tasks;
CREATE POLICY tasks_delete_policy ON public.tasks FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS clients_select_policy ON public.clients;
CREATE POLICY clients_select_policy ON public.clients FOR SELECT
USING (public.is_manager_or_admin() OR public.has_role('employee'));

DROP POLICY IF EXISTS clients_insert_policy ON public.clients;
CREATE POLICY clients_insert_policy ON public.clients FOR INSERT
WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS clients_update_policy ON public.clients;
CREATE POLICY clients_update_policy ON public.clients FOR UPDATE
USING (public.is_manager_or_admin())
WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS clients_delete_policy ON public.clients;
CREATE POLICY clients_delete_policy ON public.clients FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS invoices_select_policy ON public.invoices;
CREATE POLICY invoices_select_policy ON public.invoices FOR SELECT
USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS invoices_insert_policy ON public.invoices;
CREATE POLICY invoices_insert_policy ON public.invoices FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS invoices_update_policy ON public.invoices;
CREATE POLICY invoices_update_policy ON public.invoices FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS invoices_delete_policy ON public.invoices;
CREATE POLICY invoices_delete_policy ON public.invoices FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS expenses_select_policy ON public.expenses;
CREATE POLICY expenses_select_policy ON public.expenses FOR SELECT
USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS expenses_insert_policy ON public.expenses;
CREATE POLICY expenses_insert_policy ON public.expenses FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS expenses_update_policy ON public.expenses;
CREATE POLICY expenses_update_policy ON public.expenses FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS expenses_delete_policy ON public.expenses;
CREATE POLICY expenses_delete_policy ON public.expenses FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS transactions_select_policy ON public.transactions;
CREATE POLICY transactions_select_policy ON public.transactions FOR SELECT
USING (public.is_manager_or_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS transactions_insert_policy ON public.transactions;
CREATE POLICY transactions_insert_policy ON public.transactions FOR INSERT
WITH CHECK (public.is_manager_or_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS transactions_update_policy ON public.transactions;
CREATE POLICY transactions_update_policy ON public.transactions FOR UPDATE
USING (public.is_manager_or_admin() OR created_by = auth.uid())
WITH CHECK (public.is_manager_or_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS transactions_delete_policy ON public.transactions;
CREATE POLICY transactions_delete_policy ON public.transactions FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS projects_select_policy ON public.projects;
CREATE POLICY projects_select_policy ON public.projects FOR SELECT
USING (public.is_manager_or_admin() OR account_manager_id = auth.uid());

DROP POLICY IF EXISTS projects_insert_policy ON public.projects;
CREATE POLICY projects_insert_policy ON public.projects FOR INSERT
WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS projects_update_policy ON public.projects;
CREATE POLICY projects_update_policy ON public.projects FOR UPDATE
USING (public.is_manager_or_admin() OR account_manager_id = auth.uid())
WITH CHECK (public.is_manager_or_admin() OR account_manager_id = auth.uid());

DROP POLICY IF EXISTS projects_delete_policy ON public.projects;
CREATE POLICY projects_delete_policy ON public.projects FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS activities_select_policy ON public.activities;
CREATE POLICY activities_select_policy ON public.activities FOR SELECT
USING (public.is_manager_or_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS activities_insert_policy ON public.activities;
CREATE POLICY activities_insert_policy ON public.activities FOR INSERT
WITH CHECK (public.is_manager_or_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS activities_update_policy ON public.activities;
CREATE POLICY activities_update_policy ON public.activities FOR UPDATE
USING (public.is_manager_or_admin() OR created_by = auth.uid())
WITH CHECK (public.is_manager_or_admin() OR created_by = auth.uid());

DROP POLICY IF EXISTS activities_delete_policy ON public.activities;
CREATE POLICY activities_delete_policy ON public.activities FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS strategy_phases_select_policy ON public.strategy_phases;
CREATE POLICY strategy_phases_select_policy ON public.strategy_phases FOR SELECT
USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS strategy_phases_insert_policy ON public.strategy_phases;
CREATE POLICY strategy_phases_insert_policy ON public.strategy_phases FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS strategy_phases_update_policy ON public.strategy_phases;
CREATE POLICY strategy_phases_update_policy ON public.strategy_phases FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS strategy_phases_delete_policy ON public.strategy_phases;
CREATE POLICY strategy_phases_delete_policy ON public.strategy_phases FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS board_members_select_policy ON public.board_members;
CREATE POLICY board_members_select_policy ON public.board_members FOR SELECT
USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS board_members_insert_policy ON public.board_members;
CREATE POLICY board_members_insert_policy ON public.board_members FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS board_members_update_policy ON public.board_members;
CREATE POLICY board_members_update_policy ON public.board_members FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS board_members_delete_policy ON public.board_members;
CREATE POLICY board_members_delete_policy ON public.board_members FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS messages_select_policy ON public.messages;
CREATE POLICY messages_select_policy ON public.messages FOR SELECT
USING (public.is_manager_or_admin() OR sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
CREATE POLICY messages_insert_policy ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS messages_update_policy ON public.messages;
CREATE POLICY messages_update_policy ON public.messages FOR UPDATE
USING (public.is_manager_or_admin() OR sender_id = auth.uid())
WITH CHECK (public.is_manager_or_admin() OR sender_id = auth.uid());

DROP POLICY IF EXISTS messages_delete_policy ON public.messages;
CREATE POLICY messages_delete_policy ON public.messages FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS notifications_select_policy ON public.notifications;
CREATE POLICY notifications_select_policy ON public.notifications FOR SELECT
USING (user_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS notifications_insert_policy ON public.notifications;
CREATE POLICY notifications_insert_policy ON public.notifications FOR INSERT
WITH CHECK (public.is_manager_or_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_policy ON public.notifications;
CREATE POLICY notifications_update_policy ON public.notifications FOR UPDATE
USING (user_id = auth.uid() OR public.is_manager_or_admin())
WITH CHECK (user_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS notifications_delete_policy ON public.notifications;
CREATE POLICY notifications_delete_policy ON public.notifications FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS system_settings_select_policy ON public.system_settings;
CREATE POLICY system_settings_select_policy ON public.system_settings FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS system_settings_insert_policy ON public.system_settings;
CREATE POLICY system_settings_insert_policy ON public.system_settings FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS system_settings_update_policy ON public.system_settings;
CREATE POLICY system_settings_update_policy ON public.system_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS system_settings_delete_policy ON public.system_settings;
CREATE POLICY system_settings_delete_policy ON public.system_settings FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS automations_select_policy ON public.automations;
CREATE POLICY automations_select_policy ON public.automations FOR SELECT
USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS automations_insert_policy ON public.automations;
CREATE POLICY automations_insert_policy ON public.automations FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS automations_update_policy ON public.automations;
CREATE POLICY automations_update_policy ON public.automations FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS automations_delete_policy ON public.automations;
CREATE POLICY automations_delete_policy ON public.automations FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS automation_logs_select_policy ON public.automation_logs;
CREATE POLICY automation_logs_select_policy ON public.automation_logs FOR SELECT
USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS automation_logs_insert_policy ON public.automation_logs;
CREATE POLICY automation_logs_insert_policy ON public.automation_logs FOR INSERT
WITH CHECK (public.is_manager_or_admin());

DROP POLICY IF EXISTS automation_logs_delete_policy ON public.automation_logs;
CREATE POLICY automation_logs_delete_policy ON public.automation_logs FOR DELETE
USING (public.is_admin());
