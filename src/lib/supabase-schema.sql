-- Organization Units table
-- Represents the hierarchical structure: board → agencies → departments

create table if not exists organization_units (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('board', 'agency', 'department')),
  parent_id   uuid references organization_units(id) on delete set null,
  description text,
  manager_id  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists organization_units_parent_id_idx on organization_units(parent_id);
create index if not exists organization_units_type_idx on organization_units(type);

-- Row Level Security
alter table organization_units enable row level security;

-- All authenticated users can read
create policy "org_units_read" on organization_units
  for select to authenticated using (true);

-- Only admins can insert / update / delete
-- (replace 'مدير_عام' with your actual role column/claim logic)
create policy "org_units_write" on organization_units
  for all to authenticated
  using (
    (auth.jwt() ->> 'role') = 'مدير_عام'
  )
  with check (
    (auth.jwt() ->> 'role') = 'مدير_عام'
  );

-- ─── Seed data ────────────────────────────────────────────────────────────────

insert into organization_units (name, type, parent_id, description) values
  ('مجلس الإدارة',       'board',      null,  'أعلى سلطة في هيكل الشركة'),
  ('وكالة الدفاع',       'agency',     (select id from organization_units where name = 'مجلس الإدارة'), 'شؤون الشركة الداخلية وإدارة العلامة التجارية'),
  ('وكالة الهجوم',       'agency',     (select id from organization_units where name = 'مجلس الإدارة'), 'شؤون الشركة الخارجية والمبيعات والتوسع'),
  -- Defense departments
  ('الإدارة',            'department', (select id from organization_units where name = 'وكالة الدفاع'), 'إدارة الشؤون الداخلية'),
  ('العمليات',           'department', (select id from organization_units where name = 'وكالة الدفاع'), 'تشغيل وإدارة الأنظمة'),
  ('المالي',             'department', (select id from organization_units where name = 'وكالة الدفاع'), 'الحسابات والخزينة'),
  ('الإبداع',            'department', (select id from organization_units where name = 'وكالة الدفاع'), 'الأفكار والمحتوى'),
  ('التصميم',            'department', (select id from organization_units where name = 'وكالة الدفاع'), 'الهوية البصرية'),
  ('الحملات',            'department', (select id from organization_units where name = 'وكالة الدفاع'), 'التسويق الداخلي'),
  ('AI Lab',             'department', (select id from organization_units where name = 'وكالة الدفاع'), 'أبحاث الذكاء الاصطناعي'),
  -- Offense departments
  ('العملاء CRM',        'department', (select id from organization_units where name = 'وكالة الهجوم'), 'إدارة علاقات العملاء'),
  ('المبيعات',           'department', (select id from organization_units where name = 'وكالة الهجوم'), 'تنمية الإيرادات'),
  ('الشراكات',           'department', (select id from organization_units where name = 'وكالة الهجوم'), 'التوسع والتحالفات'),
  ('خدمة العملاء',       'department', (select id from organization_units where name = 'وكالة الهجوم'), 'دعم ومتابعة العملاء'),
  ('المتابعة',           'department', (select id from organization_units where name = 'وكالة الهجوم'), 'تتبع الطلبات والعقود'),
  ('العلاقات التجارية',  'department', (select id from organization_units where name = 'وكالة الهجوم'), 'بناء شبكة الأعمال')
on conflict do nothing;
