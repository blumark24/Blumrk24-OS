# Blumark24 OS — Phase 2 Database Report

## 1. Summary
تم تنفيذ Phase 2 عبر إنشاء migration إنتاجي جديد متوافق للخلف يضيف طبقة RBAC مطبّعة (roles/permissions/role_permissions_map)، والجداول الناقصة للتشغيل، وسياسات RLS baseline آمنة، مع الحفاظ على الجداول والسياسات القديمة لتجنّب كسر الاستعلامات الحالية.

## 2. Files Changed
| الملف | التعديل | السبب |
|---|---|---|
| `supabase/migrations/20260517_phase2_core_schema.sql` | إضافة migration جديد شامل | توحيد قاعدة البيانات، سد الجداول الناقصة، إضافة RBAC + RLS + indexes + triggers بدون كسر الجداول الحالية |
| `B24_OS_PHASE2_DATABASE_REPORT.md` | إضافة تقرير Phase 2 | توثيق ما تم تنفيذه والمخاطر والخطوات اليدوية |

## 3. Tables
| الجدول | الحالة | ملاحظات |
|---|---|---|
| roles | جديد | جدول أدوار مطبّع مع rank/is_system |
| permissions | جديد | مفاتيح permissions بنمط module.action |
| role_permissions_map | جديد | بديل مطبّع مع الإبقاء على `role_permissions` القديم للتوافق |
| departments | جديد | مرتبط بـ profiles كمدير |
| invoice_items | جديد | مرتبط بـ invoices مع on delete cascade |
| organization_units | جديد | هيكل هرمي parent_id |
| strategy_goals | جديد | أهداف استراتيجية |
| automation_rules | جديد | قواعد أتمتة مرنة config jsonb |
| reports | جديد | تعريف تقارير + filters |
| activity_logs | جديد | مراقبة تشغيلية وأحداث |
| settings | جديد | key/value بصيغة jsonb |
| profiles | تعديل متوافق | إضافة role_id/department_id/job_title/status/avatar_url |
| employees | تعديل متوافق | إضافة profile_id/department_id/employee_code |
| clients/tasks/invoices/expenses/automation_logs | تعديل متوافق | أعمدة إضافية مطلوبة بدون حذف أي عمود قديم |

## 4. Relationships
| العلاقة | الحالة |
|---|---|
| profiles.role_id -> roles.id | مضافة |
| profiles.department_id -> departments.id | مضافة |
| departments.manager_id -> profiles.id | مضافة |
| employees.profile_id -> profiles.id | مضافة |
| employees.department_id -> departments.id | مضافة |
| role_permissions_map.role_id -> roles.id | مضافة |
| role_permissions_map.permission_id -> permissions.id | مضافة |
| invoice_items.invoice_id -> invoices.id | مضافة |
| organization_units.manager_id -> profiles.id | مضافة |
| strategy_goals.owner_id -> profiles.id | مضافة |
| automation_rules.created_by -> profiles.id | مضافة |
| reports.created_by -> profiles.id | مضافة |
| activity_logs.actor_id -> profiles.id | مضافة |
| settings.updated_by -> profiles.id | مضافة |

## 5. RLS Policies
| الجدول | السياسات |
|---|---|
| roles / permissions / role_permissions_map | read للمصادقين + write بصلاحية users.manage_roles |
| departments / organization_units | view/create/update/delete حسب permissions المنظمة |
| invoice_items | CRUD حسب invoices.* permissions |
| strategy_goals | CRUD حسب strategy.* permissions |
| automation_rules | CRUD حسب automation.* permissions |
| reports | view/create/update/delete حسب reports.* permissions |
| activity_logs | view بصلاحية activity_logs.view + insert للمصادقين |
| settings | view/update وفق settings.* + delete super_admin |
| profiles | إضافة baseline policy للوصول/تعديل الملف الشخصي أو super_admin |

## 6. Roles & Permissions
| الدور | الصلاحيات |
|---|---|
| super_admin | كل الصلاحيات |
| accountant | finance/invoices/expenses + reports view/export/print + profile |
| employee | dashboard + tasks الأساسية + clients.view + profile |
| viewer | كل صلاحيات view فقط |
| department_manager | صلاحيات موظفين/مهام/تقارير ضمن baseline الحالي (scope التفصيلي Phase 3) |
| general_manager | صلاحيات واسعة مع استثناء users.manage_roles |
| board_member | dashboard/reports/strategy/organization/profile |
| chairman | view-oriented baseline |

## 7. Required Manual Supabase Steps
1. تطبيق migration `supabase/migrations/20260517_phase2_core_schema.sql` على بيئة staging أولاً.
2. إنشاء مستخدم super admin عبر Supabase Auth (لا يتم seed لكلمات مرور داخل SQL).
3. ربط profile للمستخدم الإداري بحقل `role_id` المناسب (super_admin).
4. (اختياري) توليد Supabase types وتحديث المشروع:
   - `supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/types/supabase.generated.ts`

## 8. Risks
- توجد سياسات RLS قديمة متعددة من migrations سابقة؛ migration الحالي يضيف baseline آمن دون إزالة كل legacy policies لتفادي كسر الإنتاج.
- جدول `role_permissions` القديم (text[] based) ما زال مستخدماً في الواجهة الحالية؛ تم إدخال `role_permissions_map` للتدرج وسيحتاج Phase 3 لتوحيد القراءة/الكتابة.
- بعض الجداول القديمة تستخدم naming تاريخي (`automations`, `system_settings`) بالتوازي مع الجداول المطبّعة الجديدة.

## 9. Test Results
- `npm run lint`: ناجح (مع تحذير الخطوط القديم نفسه)
- `npm run type-check`: ناجح
- `npm run build`: ناجح

## 10. Phase 2 Completion Status
Phase 2 **مكتملة كقاعدة بيانات baseline** (schema + RBAC + RLS + indexing + reporting).
الخطوة التالية المنطقية: Phase 3 لتوحيد auth/permissions على الجداول المطبّعة بالكامل وربط الواجهة تدريجياً.
