-- ============================================================
-- 20260517_phase2_core_schema.sql
-- Phase 2: Supabase & Database Alignment (idempotent baseline)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.name
      FROM public.profiles p
      LEFT JOIN public.roles r ON r.id = p.role_id
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    (
      SELECT p.role
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    'employee'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.role_permissions_map rpm ON rpm.role_id = p.role_id
      JOIN public.permissions perm ON perm.id = rpm.permission_id
      WHERE p.id = auth.uid()
        AND perm.key = permission_key
    )
  );
$$;

-- ------------------------------------------------------------
-- Core RBAC tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  name_ar text,
  description text,
  is_system boolean NOT NULL DEFAULT true,
  rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Keep existing public.role_permissions table untouched for backward compatibility.
-- Create a normalized mapping table for Phase 2 and beyond.
CREATE TABLE IF NOT EXISTS public.role_permissions_map (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- ------------------------------------------------------------
-- Domain tables missing from existing schema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  parent_id uuid REFERENCES public.organization_units(id) ON DELETE SET NULL,
  manager_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.strategy_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  owner_id uuid,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  action_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Backward-compatible alterations for existing tables
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS role_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS profile_id uuid,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS employee_code text;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS package_type text;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.automation_logs
  ADD COLUMN IF NOT EXISTS rule_id uuid,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS executed_at timestamptz NOT NULL DEFAULT now();

-- ------------------------------------------------------------
-- Foreign keys (guarded)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_id_fkey') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_department_id_fkey') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'departments_manager_id_fkey') THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_profile_id_fkey') THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_department_id_fkey') THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_units_manager_id_fkey') THEN
    ALTER TABLE public.organization_units
      ADD CONSTRAINT organization_units_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'strategy_goals_owner_id_fkey') THEN
    ALTER TABLE public.strategy_goals
      ADD CONSTRAINT strategy_goals_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'automation_rules_created_by_fkey') THEN
    ALTER TABLE public.automation_rules
      ADD CONSTRAINT automation_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_created_by_fkey') THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_actor_id_fkey') THEN
    ALTER TABLE public.activity_logs
      ADD CONSTRAINT activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_updated_by_fkey') THEN
    ALTER TABLE public.settings
      ADD CONSTRAINT settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_code_unique ON public.employees(employee_code) WHERE employee_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(rule_id);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles','profiles','departments','employees','clients','tasks','invoices','expenses',
    'organization_units','strategy_goals','automation_rules','settings'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
      EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t, t);
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- Seed roles
-- ------------------------------------------------------------
INSERT INTO public.roles (name, name_ar, description, is_system, rank)
VALUES
  ('super_admin', 'المدير الأعلى', 'Full system control', true, 100),
  ('chairman', 'رئيس مجلس الإدارة', 'Chairman role', true, 90),
  ('board_member', 'عضو مجلس الإدارة', 'Board role', true, 80),
  ('general_manager', 'المدير العام', 'General manager', true, 70),
  ('department_manager', 'مدير قسم', 'Department manager', true, 60),
  ('accountant', 'محاسب', 'Finance/accounting role', true, 50),
  ('employee', 'موظف', 'Standard employee role', true, 40),
  ('viewer', 'مشاهد', 'Read-only role', true, 10)
ON CONFLICT (name) DO UPDATE
SET name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    rank = EXCLUDED.rank,
    updated_at = now();

-- ------------------------------------------------------------
-- Seed permissions
-- ------------------------------------------------------------
INSERT INTO public.permissions (key, module, action, description)
VALUES
  ('dashboard.view','dashboard','view','View dashboard'),
  ('users.view','users','view','View users'),
  ('users.create','users','create','Create users'),
  ('users.update','users','update','Update users'),
  ('users.delete','users','delete','Delete users'),
  ('users.manage_roles','users','manage_roles','Manage user roles'),
  ('employees.view','employees','view','View employees'),
  ('employees.create','employees','create','Create employees'),
  ('employees.update','employees','update','Update employees'),
  ('employees.delete','employees','delete','Delete employees'),
  ('tasks.view','tasks','view','View tasks'),
  ('tasks.create','tasks','create','Create tasks'),
  ('tasks.update','tasks','update','Update tasks'),
  ('tasks.delete','tasks','delete','Delete tasks'),
  ('tasks.assign','tasks','assign','Assign tasks'),
  ('clients.view','clients','view','View clients'),
  ('clients.create','clients','create','Create clients'),
  ('clients.update','clients','update','Update clients'),
  ('clients.delete','clients','delete','Delete clients'),
  ('finance.view','finance','view','View finance'),
  ('finance.create','finance','create','Create finance entries'),
  ('finance.update','finance','update','Update finance entries'),
  ('finance.delete','finance','delete','Delete finance entries'),
  ('invoices.view','invoices','view','View invoices'),
  ('invoices.create','invoices','create','Create invoices'),
  ('invoices.update','invoices','update','Update invoices'),
  ('invoices.delete','invoices','delete','Delete invoices'),
  ('expenses.view','expenses','view','View expenses'),
  ('expenses.create','expenses','create','Create expenses'),
  ('expenses.update','expenses','update','Update expenses'),
  ('expenses.delete','expenses','delete','Delete expenses'),
  ('strategy.view','strategy','view','View strategy'),
  ('strategy.create','strategy','create','Create strategy'),
  ('strategy.update','strategy','update','Update strategy'),
  ('strategy.delete','strategy','delete','Delete strategy'),
  ('organization.view','organization','view','View organization'),
  ('organization.create','organization','create','Create organization units'),
  ('organization.update','organization','update','Update organization units'),
  ('organization.delete','organization','delete','Delete organization units'),
  ('automation.view','automation','view','View automation'),
  ('automation.create','automation','create','Create automation rules'),
  ('automation.update','automation','update','Update automation rules'),
  ('automation.delete','automation','delete','Delete automation rules'),
  ('automation.run','automation','run','Run automation rules'),
  ('reports.view','reports','view','View reports'),
  ('reports.create','reports','create','Create reports'),
  ('reports.export','reports','export','Export reports'),
  ('reports.print','reports','print','Print reports'),
  ('settings.view','settings','view','View settings'),
  ('settings.update','settings','update','Update settings'),
  ('activity_logs.view','activity_logs','view','View activity logs'),
  ('profile.view','profile','view','View own profile'),
  ('profile.update','profile','update','Update own profile')
ON CONFLICT (key) DO UPDATE
SET module = EXCLUDED.module,
    action = EXCLUDED.action,
    description = EXCLUDED.description;

-- ------------------------------------------------------------
-- Seed role-permission mappings
-- ------------------------------------------------------------
WITH rp AS (
  SELECT r.id AS role_id, p.id AS permission_id
  FROM public.roles r
  JOIN public.permissions p ON (
    r.name = 'super_admin'
    OR (r.name = 'accountant' AND p.key IN (
      'dashboard.view','finance.view','finance.create','finance.update','finance.delete',
      'invoices.view','invoices.create','invoices.update','invoices.delete',
      'expenses.view','expenses.create','expenses.update','expenses.delete',
      'reports.view','reports.export','reports.print','profile.view','profile.update'
    ))
    OR (r.name = 'employee' AND p.key IN (
      'dashboard.view','tasks.view','tasks.create','tasks.update','clients.view','profile.view','profile.update'
    ))
    OR (r.name = 'viewer' AND p.action = 'view')
    OR (r.name = 'department_manager' AND p.key IN (
      'dashboard.view',
      'employees.view','employees.create','employees.update',
      'tasks.view','tasks.create','tasks.update','tasks.assign',
      'reports.view','profile.view','profile.update'
    ))
    OR (r.name = 'general_manager' AND p.key NOT IN ('users.manage_roles'))
    OR (r.name = 'board_member' AND p.key IN (
      'dashboard.view','reports.view','reports.export','reports.print','strategy.view','organization.view','profile.view'
    ))
    OR (r.name = 'chairman' AND p.action = 'view')
  )
)
INSERT INTO public.role_permissions_map (role_id, permission_id)
SELECT role_id, permission_id FROM rp
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ------------------------------------------------------------
-- Enable RLS and baseline policies for Phase 2 tables
-- ------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- generic policies helper
DO $$
BEGIN
  -- roles
  DROP POLICY IF EXISTS roles_select ON public.roles;
  DROP POLICY IF EXISTS roles_write ON public.roles;
  CREATE POLICY roles_select ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY roles_write  ON public.roles FOR ALL USING (public.has_permission('users.manage_roles')) WITH CHECK (public.has_permission('users.manage_roles'));

  -- permissions
  DROP POLICY IF EXISTS permissions_select ON public.permissions;
  DROP POLICY IF EXISTS permissions_write ON public.permissions;
  CREATE POLICY permissions_select ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY permissions_write  ON public.permissions FOR ALL USING (public.has_permission('users.manage_roles')) WITH CHECK (public.has_permission('users.manage_roles'));

  -- role_permissions_map
  DROP POLICY IF EXISTS role_permissions_map_select ON public.role_permissions_map;
  DROP POLICY IF EXISTS role_permissions_map_write ON public.role_permissions_map;
  CREATE POLICY role_permissions_map_select ON public.role_permissions_map FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY role_permissions_map_write  ON public.role_permissions_map FOR ALL USING (public.has_permission('users.manage_roles')) WITH CHECK (public.has_permission('users.manage_roles'));

  -- departments
  DROP POLICY IF EXISTS departments_select ON public.departments;
  DROP POLICY IF EXISTS departments_insert ON public.departments;
  DROP POLICY IF EXISTS departments_update ON public.departments;
  DROP POLICY IF EXISTS departments_delete ON public.departments;
  CREATE POLICY departments_select ON public.departments FOR SELECT USING (public.has_permission('organization.view'));
  CREATE POLICY departments_insert ON public.departments FOR INSERT WITH CHECK (public.has_permission('organization.create'));
  CREATE POLICY departments_update ON public.departments FOR UPDATE USING (public.has_permission('organization.update')) WITH CHECK (public.has_permission('organization.update'));
  CREATE POLICY departments_delete ON public.departments FOR DELETE USING (public.has_permission('organization.delete'));

  -- invoice_items
  DROP POLICY IF EXISTS invoice_items_select ON public.invoice_items;
  DROP POLICY IF EXISTS invoice_items_insert ON public.invoice_items;
  DROP POLICY IF EXISTS invoice_items_update ON public.invoice_items;
  DROP POLICY IF EXISTS invoice_items_delete ON public.invoice_items;
  CREATE POLICY invoice_items_select ON public.invoice_items FOR SELECT USING (public.has_permission('invoices.view'));
  CREATE POLICY invoice_items_insert ON public.invoice_items FOR INSERT WITH CHECK (public.has_permission('invoices.create'));
  CREATE POLICY invoice_items_update ON public.invoice_items FOR UPDATE USING (public.has_permission('invoices.update')) WITH CHECK (public.has_permission('invoices.update'));
  CREATE POLICY invoice_items_delete ON public.invoice_items FOR DELETE USING (public.has_permission('invoices.delete'));

  -- organization_units
  DROP POLICY IF EXISTS organization_units_select ON public.organization_units;
  DROP POLICY IF EXISTS organization_units_insert ON public.organization_units;
  DROP POLICY IF EXISTS organization_units_update ON public.organization_units;
  DROP POLICY IF EXISTS organization_units_delete ON public.organization_units;
  CREATE POLICY organization_units_select ON public.organization_units FOR SELECT USING (public.has_permission('organization.view'));
  CREATE POLICY organization_units_insert ON public.organization_units FOR INSERT WITH CHECK (public.has_permission('organization.create'));
  CREATE POLICY organization_units_update ON public.organization_units FOR UPDATE USING (public.has_permission('organization.update')) WITH CHECK (public.has_permission('organization.update'));
  CREATE POLICY organization_units_delete ON public.organization_units FOR DELETE USING (public.has_permission('organization.delete'));

  -- strategy_goals
  DROP POLICY IF EXISTS strategy_goals_select ON public.strategy_goals;
  DROP POLICY IF EXISTS strategy_goals_insert ON public.strategy_goals;
  DROP POLICY IF EXISTS strategy_goals_update ON public.strategy_goals;
  DROP POLICY IF EXISTS strategy_goals_delete ON public.strategy_goals;
  CREATE POLICY strategy_goals_select ON public.strategy_goals FOR SELECT USING (public.has_permission('strategy.view'));
  CREATE POLICY strategy_goals_insert ON public.strategy_goals FOR INSERT WITH CHECK (public.has_permission('strategy.create'));
  CREATE POLICY strategy_goals_update ON public.strategy_goals FOR UPDATE USING (public.has_permission('strategy.update')) WITH CHECK (public.has_permission('strategy.update'));
  CREATE POLICY strategy_goals_delete ON public.strategy_goals FOR DELETE USING (public.has_permission('strategy.delete'));

  -- automation_rules
  DROP POLICY IF EXISTS automation_rules_select ON public.automation_rules;
  DROP POLICY IF EXISTS automation_rules_insert ON public.automation_rules;
  DROP POLICY IF EXISTS automation_rules_update ON public.automation_rules;
  DROP POLICY IF EXISTS automation_rules_delete ON public.automation_rules;
  CREATE POLICY automation_rules_select ON public.automation_rules FOR SELECT USING (public.has_permission('automation.view'));
  CREATE POLICY automation_rules_insert ON public.automation_rules FOR INSERT WITH CHECK (public.has_permission('automation.create'));
  CREATE POLICY automation_rules_update ON public.automation_rules FOR UPDATE USING (public.has_permission('automation.update')) WITH CHECK (public.has_permission('automation.update'));
  CREATE POLICY automation_rules_delete ON public.automation_rules FOR DELETE USING (public.has_permission('automation.delete'));

  -- reports
  DROP POLICY IF EXISTS reports_select ON public.reports;
  DROP POLICY IF EXISTS reports_insert ON public.reports;
  DROP POLICY IF EXISTS reports_update ON public.reports;
  DROP POLICY IF EXISTS reports_delete ON public.reports;
  CREATE POLICY reports_select ON public.reports FOR SELECT USING (public.has_permission('reports.view'));
  CREATE POLICY reports_insert ON public.reports FOR INSERT WITH CHECK (public.has_permission('reports.create'));
  CREATE POLICY reports_update ON public.reports FOR UPDATE USING (public.has_permission('reports.create')) WITH CHECK (public.has_permission('reports.create'));
  CREATE POLICY reports_delete ON public.reports FOR DELETE USING (public.has_permission('reports.create'));

  -- activity_logs
  DROP POLICY IF EXISTS activity_logs_select ON public.activity_logs;
  DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
  CREATE POLICY activity_logs_select ON public.activity_logs FOR SELECT USING (public.has_permission('activity_logs.view'));
  CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  -- settings
  DROP POLICY IF EXISTS settings_select ON public.settings;
  DROP POLICY IF EXISTS settings_insert ON public.settings;
  DROP POLICY IF EXISTS settings_update ON public.settings;
  DROP POLICY IF EXISTS settings_delete ON public.settings;
  CREATE POLICY settings_select ON public.settings FOR SELECT USING (public.has_permission('settings.view'));
  CREATE POLICY settings_insert ON public.settings FOR INSERT WITH CHECK (public.has_permission('settings.update'));
  CREATE POLICY settings_update ON public.settings FOR UPDATE USING (public.has_permission('settings.update')) WITH CHECK (public.has_permission('settings.update'));
  CREATE POLICY settings_delete ON public.settings FOR DELETE USING (public.is_super_admin());
END $$;

-- Profile self-access baseline refinement (without dropping existing broader policies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_self_select_phase2'
  ) THEN
    CREATE POLICY profiles_self_select_phase2 ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_self_update_phase2'
  ) THEN
    CREATE POLICY profiles_self_update_phase2 ON public.profiles FOR UPDATE
    USING (id = auth.uid() OR public.is_super_admin())
    WITH CHECK (id = auth.uid() OR public.is_super_admin());
  END IF;
END $$;

-- ------------------------------------------------------------
-- Seed note (safe): no auth passwords or auth.users inserts here.
-- ------------------------------------------------------------
