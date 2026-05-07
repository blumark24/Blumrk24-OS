-- ============================================================
-- Migration 002 — Missing tables + schema fixes
-- Run this in Supabase Dashboard → SQL Editor
-- All statements are idempotent (safe to run multiple times)
-- ============================================================

-- ── 1. Add updated_at to profiles ───────────────────────────
alter table public.profiles
  add column if not exists updated_at timestamptz default now();

-- ── 2. system_settings ───────────────────────────────────────
create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.system_settings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'system_settings'
      and policyname = 'system_settings: authenticated read'
  ) then
    create policy "system_settings: authenticated read"
      on public.system_settings for select
      using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'system_settings'
      and policyname = 'system_settings: super_admin write'
  ) then
    create policy "system_settings: super_admin write"
      on public.system_settings for all
      using (public.get_my_role() = 'super_admin');
  end if;
end $$;

-- ── 3. role_permissions ──────────────────────────────────────
create table if not exists public.role_permissions (
  role        text primary key,
  permissions text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.role_permissions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'role_permissions'
      and policyname = 'role_permissions: authenticated read'
  ) then
    create policy "role_permissions: authenticated read"
      on public.role_permissions for select
      using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'role_permissions'
      and policyname = 'role_permissions: super_admin write'
  ) then
    create policy "role_permissions: super_admin write"
      on public.role_permissions for all
      using (public.get_my_role() = 'super_admin');
  end if;
end $$;

-- ── 4. strategy_phases ───────────────────────────────────────
create table if not exists public.strategy_phases (
  id              serial primary key,
  title           text not null default '',
  description     text not null default '',
  progress        integer not null default 0 check (progress between 0 and 100),
  budget          numeric(14,2) not null default 0,
  start_date      text not null default '',
  end_date        text not null default '',
  target_clients  integer not null default 0,
  current_clients integer not null default 0,
  goals           text[] not null default '{}',
  status          text not null default 'مخطط'
                    check (status in ('مخطط','جارٍ','مكتمل','متوقف')),
  sort_order      integer not null default 0,
  updated_at      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- Add sort_order and updated_at if table existed without them
alter table public.strategy_phases
  add column if not exists sort_order integer not null default 0;
alter table public.strategy_phases
  add column if not exists updated_at timestamptz not null default now();

alter table public.strategy_phases enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'strategy_phases'
      and policyname = 'strategy_phases: authenticated read'
  ) then
    create policy "strategy_phases: authenticated read"
      on public.strategy_phases for select
      using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'strategy_phases'
      and policyname = 'strategy_phases: super_admin write'
  ) then
    create policy "strategy_phases: super_admin write"
      on public.strategy_phases for all
      using (public.get_my_role() = 'super_admin');
  end if;
end $$;

-- ── 5. automations ───────────────────────────────────────────
create table if not exists public.automations (
  id          text primary key,
  title       text not null,
  enabled     boolean not null default true,
  last_run    timestamptz,
  run_count   integer not null default 0,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.automations enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'automations'
      and policyname = 'automations: authenticated read'
  ) then
    create policy "automations: authenticated read"
      on public.automations for select
      using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'automations'
      and policyname = 'automations: super_admin write'
  ) then
    create policy "automations: super_admin write"
      on public.automations for all
      using (public.get_my_role() = 'super_admin');
  end if;
end $$;

-- Seed default automations if the table was just created
insert into public.automations (id, title, enabled)
values
  ('fund-dist',       'توزيع الأموال التلقائي',      true),
  ('task-reminder',   'تنبيه قبل موعد المهمة',       true),
  ('late-tasks',      'تحديث المهام المتأخرة',        true),
  ('client-followup', 'متابعة العملاء المحتملين',     true),
  ('workload',        'مراقبة عبء العمل',             false),
  ('kpi-update',      'تحديث مؤشرات الأداء',          true),
  ('weekly-report',   'التقرير الأسبوعي',             true)
on conflict (id) do nothing;

-- ── 6. automation_logs ───────────────────────────────────────
create table if not exists public.automation_logs (
  id          uuid primary key default uuid_generate_v4(),
  rule_id     text not null,
  rule_title  text not null,
  result      text not null,
  status      text not null default 'success'
                check (status in ('success','warning','error')),
  created_at  timestamptz not null default now()
);

alter table public.automation_logs enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'automation_logs'
      and policyname = 'automation_logs: authenticated read'
  ) then
    create policy "automation_logs: authenticated read"
      on public.automation_logs for select
      using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'automation_logs'
      and policyname = 'automation_logs: authenticated insert'
  ) then
    create policy "automation_logs: authenticated insert"
      on public.automation_logs for insert
      with check (auth.role() = 'authenticated');
  end if;
end $$;

-- ── 7. Security: prevent self-role-escalation on profiles ────
-- Drop the broad "update own" policy and replace with one that
-- blocks elevating your own role unless you are already super_admin.
drop policy if exists "profiles: update own" on public.profiles;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
      and policyname = 'profiles: update own no-escalate'
  ) then
    create policy "profiles: update own no-escalate"
      on public.profiles for update
      using (auth.uid() = id)
      with check (
        -- Allow if super_admin, OR if the role is not being changed
        public.get_my_role() = 'super_admin'
        or role = public.get_my_role()
      );
  end if;
end $$;

-- ============================================================
-- After running this migration, verify with:
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
-- ============================================================
