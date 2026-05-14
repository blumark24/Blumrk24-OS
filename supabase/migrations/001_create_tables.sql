-- 001_create_tables.sql
-- Creates production tables for profiles, employees, tasks, clients, invoices, expenses
-- and additional application tables required by the app.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (required for auth role mapping)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  role text NOT NULL DEFAULT 'employee', -- expected: super_admin, admin, manager, employee (but app may use Arabic strings)
  full_name text,
  name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employees (backwards-compatible fields preserved)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  name text,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL DEFAULT 'employee',
  department text,
  job_title text,
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  join_date date,
  performance integer NOT NULL DEFAULT 0,
  tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- allow both English and common Arabic role strings used by older mock data
  CONSTRAINT employees_role_check CHECK (
    role IN (
      'super_admin','admin','manager','employee',
      'مدير_عام','مدير_مبيعات','مدير_مالي','موظف'
    )
  )
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  package text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  assigned_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  issue_date date,
  due_date date,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  vendor text,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date,
  incurred_at date,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Additional tables required by the app (from mockData/useData)

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  category text,
  date date,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  progress integer DEFAULT 0,
  budget numeric DEFAULT 0,
  deadline date,
  status text,
  account_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activities (audit/stream)
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  description text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Strategy phases
CREATE TABLE IF NOT EXISTS public.strategy_phases (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  progress integer DEFAULT 0,
  budget numeric DEFAULT 0,
  start_date date,
  end_date date,
  target_clients integer DEFAULT 0,
  current_clients integer DEFAULT 0,
  goals jsonb,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Board members
CREATE TABLE IF NOT EXISTS public.board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  position text,
  joined_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- System settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Automations
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger jsonb,
  action jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Automation logs
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES public.automations(id) ON DELETE SET NULL,
  status text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees (user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees (email);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_employee_id ON public.tasks (assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks (client_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (email);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions (created_by);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
