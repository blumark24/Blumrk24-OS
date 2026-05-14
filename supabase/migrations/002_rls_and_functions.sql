-- 002_rls_and_functions.sql
-- Row Level Security and helper functions for Blumark24-OS.
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

ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employees_select_policy ON public.employees;
DROP POLICY IF EXISTS employees_insert_policy ON public.employees;
DROP POLICY IF EXISTS employees_update_policy ON public.employees;
DROP POLICY IF EXISTS employees_delete_policy ON public.employees;

CREATE POLICY employees_select_policy
ON public.employees
FOR SELECT
USING (
  public.is_manager_or_admin()
  OR user_id = auth.uid()
);

CREATE POLICY employees_insert_policy
ON public.employees
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY employees_update_policy
ON public.employees
FOR UPDATE
USING (
  public.is_admin()
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_admin()
  OR user_id = auth.uid()
);

CREATE POLICY employees_delete_policy
ON public.employees
FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS tasks_select_policy ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_policy ON public.tasks;
DROP POLICY IF EXISTS tasks_update_policy ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_policy ON public.tasks;

CREATE POLICY tasks_select_policy
ON public.tasks
FOR SELECT
USING (
  public.is_manager_or_admin()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

CREATE POLICY tasks_insert_policy
ON public.tasks
FOR INSERT
WITH CHECK (
  public.is_manager_or_admin()
  OR created_by = auth.uid()
);

CREATE POLICY tasks_update_policy
ON public.tasks
FOR UPDATE
USING (
  public.is_manager_or_admin()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
)
WITH CHECK (
  public.is_manager_or_admin()
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

CREATE POLICY tasks_delete_policy
ON public.tasks
FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS clients_select_policy ON public.clients;
DROP POLICY IF EXISTS clients_insert_policy ON public.clients;
DROP POLICY IF EXISTS clients_update_policy ON public.clients;
DROP POLICY IF EXISTS clients_delete_policy ON public.clients;

CREATE POLICY clients_select_policy
ON public.clients
FOR SELECT
USING (
  public.is_manager_or_admin()
  OR public.has_role('employee')
);

CREATE POLICY clients_insert_policy
ON public.clients
FOR INSERT
WITH CHECK (public.is_manager_or_admin());

CREATE POLICY clients_update_policy
ON public.clients
FOR UPDATE
USING (public.is_manager_or_admin())
WITH CHECK (public.is_manager_or_admin());

CREATE POLICY clients_delete_policy
ON public.clients
FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS invoices_select_policy ON public.invoices;
DROP POLICY IF EXISTS invoices_insert_policy ON public.invoices;
DROP POLICY IF EXISTS invoices_update_policy ON public.invoices;
DROP POLICY IF EXISTS invoices_delete_policy ON public.invoices;

CREATE POLICY invoices_select_policy
ON public.invoices
FOR SELECT
USING (public.is_manager_or_admin());

CREATE POLICY invoices_insert_policy
ON public.invoices
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY invoices_update_policy
ON public.invoices
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY invoices_delete_policy
ON public.invoices
FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS expenses_select_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_insert_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_update_policy ON public.expenses;
DROP POLICY IF EXISTS expenses_delete_policy ON public.expenses;

CREATE POLICY expenses_select_policy
ON public.expenses
FOR SELECT
USING (public.is_manager_or_admin());

CREATE POLICY expenses_insert_policy
ON public.expenses
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY expenses_update_policy
ON public.expenses
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY expenses_delete_policy
ON public.expenses
FOR DELETE
USING (public.is_admin());
