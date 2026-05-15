# Blumark24 OS — Production QA Audit Report
**Issue #37 · Senior Engineering Audit**
**Date:** 2026-05-15
**Audited by:** Claude Code (QA / CTO / DevOps / Product perspectives)
**Branch:** `claude/repository-audit-qa-czcuv`
**App URL:** https://blumark24-os.vercel.app

---

## A. Executive Summary

### Overall Readiness Score: **52 / 100**

### Go / No-Go Recommendation: **NO-GO ⛔**

The core architecture is sound and the security foundations are correct (Supabase RLS, server-side auth, bearer-token API routes). However, there are **4 blocking defects** that prevent production deployment:

1. `j3b.ksa@gmail.com` (and possibly other admins) shows `موظف` because the `profiles` row in the DB still has `role = 'employee'` — the trigger creates it with the default. A data fix + a code fix in Sidebar are both required.
2. The Sidebar footer shows English role text (`super admin`) instead of the correct Arabic label (`مدير أعلى`).
3. The `invoices` and `expenses` tables referenced by `finance.ts` do not exist in any applied migration. If the finance service is ever called, it will silently error.
4. `defense_manager` has `manage_automations` UI permission but the `automations` table RLS only permits `super_admin` to write — toggling or running automation rules silently fails for non-admins.

### Top 10 Risks

| # | Severity | Risk |
|---|----------|------|
| 1 | CRITICAL | `super_admin` shows as `موظف` — role not set in DB for `j3b.ksa@gmail.com` |
| 2 | CRITICAL | Sidebar renders raw English role (`super admin`) instead of `ROLE_LABELS` |
| 3 | CRITICAL | `invoices` / `expenses` Supabase tables do not exist; finance.ts service dead |
| 4 | CRITICAL | Automation RLS mismatch: `defense_manager` can see but cannot write automations |
| 5 | HIGH | `buildUser` fallback upserts role `employee` if profile lookup fails — user permanently demoted |
| 6 | HIGH | `force_password_change` not enforced in middleware; only client-side redirect |
| 7 | HIGH | `types/index.ts` exports stale Arabic `UserRole` enum conflicting with canonical English roles |
| 8 | HIGH | Automation execution is fully client-side simulation — no backend scheduler exists |
| 9 | HIGH | `addManagedUser` generates `Date.now().toString()` as userId instead of real UUID |
| 10 | MEDIUM | Hardcoded admin emails in 3 server files; no SUPABASE_SERVICE_ROLE_KEY validation on startup |

---

## B. Defect Matrix

| ID | Severity | Module | Current Behavior | Expected Behavior | Root Cause | Files | Fix Recommendation |
|----|----------|--------|-----------------|-------------------|------------|-------|--------------------|
| D-01 | CRITICAL | Auth / Role Display | `j3b.ksa@gmail.com` sees `موظف` in header and sidebar | Should see `مدير أعلى` | `profiles` row has `role = 'employee'` (trigger default); DB data not updated | `supabase-schema.sql` trigger `handle_new_user()`, Supabase DB | Run: `UPDATE profiles SET role='super_admin' WHERE email='j3b.ksa@gmail.com'` |
| D-02 | CRITICAL | Sidebar / Role Label | Sidebar footer shows `"super admin"` (English, space-separated) | Should show `"مدير أعلى"` | `Sidebar.tsx:162` uses `{userRole.replace(/_/g," ")}` instead of `ROLE_LABELS[userRole]` | `src/components/layout/Sidebar.tsx:162` | Replace with `{ROLE_LABELS[userRole] ?? userRole.replace(/_/g, " ")}` after importing `ROLE_LABELS` |
| D-03 | CRITICAL | Finance Service | `finance.ts` CRUD for invoices/expenses silently errors | Should CRUD invoices and expenses tables | Tables `invoices` and `expenses` not defined in any migration; service module never imported by any page | `src/lib/services/finance.ts`, all migrations | Either create the tables and wire the service, or delete the dead file |
| D-04 | CRITICAL | Automation / RLS | Non-`super_admin` users (e.g. `defense_manager`) with `manage_automations` permission get silent write failure when toggling or running automations | Toggle/run should persist | `automations` table RLS only allows `super_admin` to write; `defense_manager` has UI permission but DB blocks | `supabase/migrations/002_missing_tables_and_fixes.sql`, `src/contexts/PermissionsContext.tsx` | Extend automations write policy to include `defense_manager` OR remove `manage_automations` from defense_manager perms |
| D-05 | HIGH | Auth / buildUser | If `profiles` row lookup fails for any reason, `buildUser` upserts a new row with `role='employee'` — permanently demoting admin | Should error loudly or not demote | `AuthContext.tsx:79-94` — silent fallback upsert with hardcoded `role: 'employee'` | `src/contexts/AuthContext.tsx:79-94` | Remove silent upsert from client; log error and show "session error" instead. Profile creation belongs only in server-side create-user route |
| D-06 | HIGH | Auth / Middleware | `force_password_change` only enforced client-side after hydration; after hard refresh on a protected page, brief access before redirect | All protected routes blocked until password changed | `middleware.ts` only checks for auth token, not `force_password_change` flag | `middleware.ts` | Add `force_password_change` check to middleware (read from cookie or session metadata) |
| D-07 | HIGH | Types | `types/index.ts` exports `UserRole` as `"مدير_عام" \| "مدير_مالي" \| "مدير_مبيعات" \| "مدير" \| "موظف"` | Should match canonical `super_admin \| board_member \| ...` | Stale enum never updated after role system redesign | `src/types/index.ts:1` | Replace old Arabic union with canonical English roles |
| D-08 | HIGH | Automation | "Run Now" executes a local JS function that produces a string result; no actual backend job, email, or real DB side-effect runs | Backend scheduler should execute rules at configured intervals | No backend scheduler (cron/edge function) exists; execution is 100% simulated | `src/app/automation/page.tsx:82-123` | Document as "simulation mode"; build real edge function execution layer in Phase 3 |
| D-09 | HIGH | PermissionsContext | `addManagedUser` assigns `Date.now().toString()` as `userId` | Should use real UUID returned by server | `PermissionsContext.tsx:280` — `userId: Date.now().toString()` | Use the UUID returned from the API create-user response |
| D-10 | MEDIUM | API / Security | Admin emails hardcoded in 3 API routes: `["blumark24@gmail.com","blumark.sa@gmail.com"]` | Should come from env variable | Copy-pasted literal in create-user, update-user, delete-user routes | `src/app/api/admin/create-user/route.ts`, `update-user`, `delete-user` | Extract to `process.env.ADMIN_EMAILS` or shared constant in `lib/` |
| D-11 | MEDIUM | Finance | Finance page uses `useTransactions()` (transactions table); `finance.ts` service exposes `invoices`/`expenses` API that nothing calls | Finance module should be unified | Two parallel finance implementations; no page imports `finance.ts` | `src/lib/services/finance.ts`, `src/app/finance/page.tsx` | Decide: delete finance.ts or create invoices/expenses tables and wire UI |
| D-12 | MEDIUM | Auth | `buildUser` selects `full_name, avatar_url` in `FULL_COLS` but `full_name` is never added to the schema (only `avatar_url` added by migration 006) | Should not select non-existent columns | `full_name` column does not exist in `profiles` table; query silently falls to `SAFE_COLS` on every call | `src/contexts/AuthContext.tsx:53,71` | Remove `full_name` from `FULL_COLS`; keep `avatar_url` only if migration 006 is confirmed applied |
| D-13 | MEDIUM | Settings / i18n | `localStorage['blumark-theme']` stores a `language` field but no locale-switching logic exists in the app | Language toggle should switch UI locale | Stored but never read; UI is 100% Arabic | `src/app/settings/page.tsx:346` | Either implement locale switching or remove the `language` key from localStorage |
| D-14 | MEDIUM | Admin Actions | User create/update/delete admin API routes do not log to `activities` table | Admin actions should be audited | Missing `logActivity()` calls in API routes | `src/app/api/admin/create-user/route.ts`, `update-user`, `delete-user` | Add `logActivity()` call after each successful admin operation |
| D-15 | MEDIUM | RBAC / Employees | Employees page has no `PageGuard`; it checks `hasPermission('manage_users')` in-page logic but also shows employee edit buttons to all roles | Employee write actions should be restricted by role | Inconsistent guard strategy; some pages use `PageGuard`, others use inline checks | `src/app/employees/page.tsx` | Wrap with `PageGuard permission="manage_users"` and remove inline duplication |
| D-16 | LOW | Auth | Auth page shows `admin@blumark24.com` as example email in comments/placeholder | Should use generic placeholder | Hardcoded in schema comments; visible if user inspects source | `src/lib/supabase-schema.sql:340` | Replace with `your-admin@your-domain.com` |
| D-17 | LOW | Middleware | `middleware.ts` checks `sb-*-auth-token` cookies but does not validate the JWT; a crafted cookie could pass the check | Should verify token server-side | Cookie presence check only; actual JWT validation only happens when Supabase is called | `middleware.ts` | Use Supabase SSR client (`@supabase/ssr`) for server-side session validation in middleware |
| D-18 | LOW | Admin Recovery | `/admin-recovery` page is a visible route in middleware but is a placeholder | Should have emergency admin access | Not implemented | `src/app/admin-recovery/page.tsx` | Either implement or remove from middleware protected paths |
| D-19 | LOW | Rate Limiting | No rate limiting on any API endpoint | Login and admin endpoints should be rate-limited | Not implemented | All `src/app/api/**` | Add Vercel middleware rate limiting (e.g., 5 req/min per IP) |
| D-20 | LOW | Messages RLS | Any authenticated user can INSERT and UPDATE messages | Only authorized senders should write | `messages: authenticated write` policy too broad | `supabase/migrations/003_messages_and_permissions.sql` | Restrict INSERT to super_admin or designated roles |

---

## C. Persistence Matrix

| Module | Action | Current Behavior | Supabase Table/Function | Persists After Refresh | UX Feedback | Status | Required Fix |
|--------|--------|-----------------|------------------------|----------------------|-------------|--------|-------------|
| Employees | Create | Inserts to `employees` table | `employees` | ✅ Yes | Toast on success | ✅ Real | None |
| Employees | Update | Updates `employees` row | `employees` | ✅ Yes | Toast on success | ✅ Real | None |
| Employees | Delete | Deletes `employees` row | `employees` | ✅ Yes | Toast on success | ✅ Real | None |
| Employees | Realtime | Supabase channel subscription | `employees-rt` | ✅ Live | Instant refresh | ✅ Real | None |
| Tasks | Create | Inserts to `tasks` table + notification | `tasks`, `notifications`, `activities` | ✅ Yes | Toast + notification | ✅ Real | None |
| Tasks | Update | Updates `tasks` row | `tasks`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Tasks | Delete | Deletes `tasks` row | `tasks`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Tasks | Realtime | Supabase channel subscription | `tasks-rt` | ✅ Live | Instant refresh | ✅ Real | None |
| Clients/CRM | Create | Inserts to `clients` table + notification | `clients`, `notifications`, `activities` | ✅ Yes | Toast + notification | ✅ Real | None |
| Clients/CRM | Update | Updates `clients` row | `clients`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Clients/CRM | Delete | Deletes `clients` row | `clients`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Finance / Transactions | Create | Inserts to `transactions` | `transactions`, `activities`, `notifications` | ✅ Yes | Toast + notification | ✅ Real | None |
| Finance / Transactions | Update | Updates `transactions` row | `transactions`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Finance / Transactions | Delete | Deletes `transactions` row | `transactions`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Finance / Invoices | Create/Read/Update/Delete | Calls `finance.ts` → `supabase.from("invoices")` | ❌ Table does not exist | ❌ No | ❌ None / error | ❌ DEAD | Create `invoices` table in migration OR delete finance.ts |
| Finance / Expenses | Create/Read/Update/Delete | Calls `finance.ts` → `supabase.from("expenses")` | ❌ Table does not exist | ❌ No | ❌ None / error | ❌ DEAD | Create `expenses` table in migration OR delete finance.ts |
| Strategy Phases | Update | Updates `strategy_phases` row | `strategy_phases` | ✅ Yes | Toast | ✅ Real | None |
| Strategy Phases | Realtime | Supabase channel | `strategy-phases-rt` | ✅ Live | Instant refresh | ✅ Real | None |
| Board Members | Create/Update/Delete | Via `db.ts` helpers → `board_members` | `board_members`, `activities` | ✅ Yes | Toast | ✅ Real | None |
| Automation / Toggle | On/Off | Updates `automations.enabled` in DB | `automations` | ✅ super_admin only | Toast | ⚠️ Broken for defense_manager (RLS) | Fix automations RLS policy |
| Automation / Run Now | Execute | Runs local JS function, updates `run_count`, inserts log | `automations`, `automation_logs` | ✅ run_count persists | Toast | ⚠️ Simulated execution only | Document or build real backend scheduler |
| Reports | View | Computed from live DB data (no dedicated table) | `transactions`, `tasks`, `clients` | ✅ Yes (computed fresh) | None | ✅ Acceptable | None |
| Settings / Theme | Save | Writes `localStorage['blumark-theme']` | localStorage only | ⚠️ Browser-scoped only | Toast | ⚠️ Acceptable for UX preference | No business data at risk |
| Settings / System | Save | Writes to `system_settings` table | `system_settings` | ✅ Yes | Toast | ✅ Real | None |
| Role Permissions | Save | Upserts to `role_permissions` table | `role_permissions` | ✅ Yes | Toast | ✅ Real | None |
| User Profile / Role | Auth hydration | Reads `profiles.role` from Supabase | `profiles` | ✅ Yes (on session restore) | None | ⚠️ Bug: fallback upserts employee role | Fix buildUser fallback |
| Notifications | Realtime | Supabase channel subscription | `notifications` | ✅ Yes | Badge count | ✅ Real | None |
| Messages | Realtime | Supabase channel subscription | `messages` | ✅ Yes | Badge count | ✅ Real | None |

---

## D. Auth / RBAC Matrix

| Role | Expected Access | Current Access | Issue | Required Fix |
|------|----------------|----------------|-------|-------------|
| `super_admin` | All permissions + all nav items | All permissions (IF DB role is set correctly) | D-01: DB has `employee` for `j3b.ksa@gmail.com`; D-02: Sidebar shows "super admin" not "مدير أعلى" | Run `UPDATE profiles SET role='super_admin' WHERE email='j3b.ksa@gmail.com'`; fix Sidebar label |
| `board_member` | Dashboard, Board, Finance, Reports | Correct | None found | None |
| `defense_manager` | Dashboard, Board, Users, Tasks, Reports, Automations | UI correct but automation writes fail (RLS) | D-04: automations table only allows super_admin to write | Extend automations RLS to include defense_manager |
| `attack_manager` | Dashboard, Clients, Tasks, Reports | Correct | None found | None |
| `finance_manager` | Dashboard, Finance, Reports | Correct | Transactions write works; invoices/expenses table missing | Resolve D-03 |
| `employee` | Dashboard, Tasks only | Correct | None found | None |
| Any role (Sidebar) | Shows Arabic role label | Shows English "super admin" / "board member" etc. | D-02 | Fix Sidebar.tsx:162 |
| Role hydration on refresh | Role from `profiles` table survives refresh | Role survives if session persists; wrong if fallback upsert runs | D-05 | Remove client-side upsert fallback |
| New user (first login) | Force password change, then correct role | `handle_new_user` trigger creates profile with `role='employee'`; admin must manually promote | By design, but undocumented | Add post-creation SQL to setup docs |

### RBAC Permission Map (Verified)

| Permission | super_admin | board_member | defense_manager | attack_manager | finance_manager | employee |
|-----------|:-----------:|:------------:|:---------------:|:--------------:|:---------------:|:--------:|
| view_dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage_board | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| manage_roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manage_tasks | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| manage_clients | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| manage_finance | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| manage_reports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| manage_settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manage_automations | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## E. Automation Reality Check

### What Is REAL (persists to DB):

| Item | Status |
|------|--------|
| Toggle on/off per rule | ✅ Real — writes `automations.enabled` to DB (super_admin only) |
| Run count tracking | ✅ Real — writes `automations.run_count` and `last_run` |
| Execution log entries | ✅ Real — inserts rows into `automation_logs` table |
| Realtime subscription on automations table | ✅ Real |

### What Is SIMULATED (client-side only):

| Item | Status |
|------|--------|
| Fund distribution (40/10/10/20/20) | ⚠️ Simulated — produces a string result from local transaction data; no actual bank transfer or fund DB table update |
| Task deadline reminders | ⚠️ Simulated — counts tasks locally; no actual notification is created in `notifications` table |
| Late task detection | ⚠️ Simulated — counts late tasks locally; does NOT update `tasks.status` to `متأخرة` in DB |
| Client follow-up | ⚠️ Simulated — counts pending clients locally; no reminder notification created |
| Workload calculation | ⚠️ Simulated — counts active tasks locally; does not update any employee workload field |
| KPI update | ⚠️ Simulated — reads live counts; KPI is already real-time from DB hooks |
| Weekly report | ⚠️ Simulated — generates a string; no report stored or emailed |
| Scheduled execution (cron) | ❌ Does NOT exist — rules only run when user manually clicks "Run Now" |
| Email notifications | ❌ Does NOT exist — no email service integrated |
| Real side-effects | ❌ None — running automation rules has zero real effect on DB data other than incrementing run_count |

### What Must Be Built for Real Automation:

1. **Supabase Edge Function or Vercel Cron Job** to execute rules on schedule
2. **Late task detection**: must call `supabase.from("tasks").update({status:"متأخرة"}).lt("due_date", today).neq("status","مكتملة")`
3. **Task reminder notifications**: must INSERT into `notifications` table per upcoming-task user
4. **Client follow-up reminders**: must INSERT into `notifications` per manager per pending client
5. **Fund distribution**: if required, must INSERT into a dedicated `funds` ledger table
6. **Report generation**: must INSERT into a `reports` table or send via email provider

---

## F. Deployment / Environment Risk

| Risk | Severity | Details |
|------|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` missing | HIGH | If not set in Vercel, all admin API routes return 500 with clear error message. But there is no startup check. |
| `NEXT_PUBLIC_SUPABASE_URL` or `ANON_KEY` missing | CRITICAL | Client fails to initialize; app renders blank |
| Service role key client-side exposure | ✅ Safe | Service role only used in `src/app/api/**` (server-side) |
| `ANTHROPIC_API_KEY` | MEDIUM | Referenced in `.env.local.example`; AI assistant page may fail silently if not set |
| Vercel `allowedOrigins` for Server Actions | ✅ Correct | `blumark24.com`, `www.blumark24.com`, `localhost:3000` |
| Security headers | ✅ Good | X-Frame-Options: DENY, nosniff, CSP, HSTS all present in `next.config.mjs` |
| Migration drift | HIGH | Multiple overlapping migration files (001a, 001b, 002a, 002b, 002c…). No clear linear migration history. Risk of partial application. `final-production-schema.sql` exists but it's unclear if it's canonical. |
| `supabase-schema.sql` vs `final-production-schema.sql` | HIGH | Two separate "canonical" schema files in different paths. Ambiguous which is authoritative. |

---

## G. Mobile / RTL / UX Assessment

| Area | Status | Notes |
|------|--------|-------|
| RTL layout | ✅ Good | `dir="rtl"` on `<html>`; Tailwind classes use `mr-auto`, etc. correctly |
| Mobile sidebar | ✅ Good | Mobile overlay sidebar implemented with backdrop and slide-in |
| Mobile hamburger menu | ✅ Good | `onMobileMenuToggle` wired in Header → DashboardLayout |
| Tablet breakpoints | ✅ Good | `lg:hidden` / `hidden lg:block` pattern used consistently |
| Arabic role labels | ⚠️ Bug | Header: correct (`ROLE_LABELS`). Sidebar footer: incorrect (raw English) |
| Arabic status badges | ✅ Good | `نشط` / `غير نشط` displayed correctly |
| Toast notifications | ✅ Good | RTL-aware, 4-second auto-dismiss |
| Search | ✅ Good | Live search against Supabase with 250ms debounce |
| Notification badge | ✅ Good | Unread count shown correctly |

---

## H. localStorage Usage Classification

| Key | Location | Data Stored | Classification | Risk |
|-----|----------|-------------|----------------|------|
| `blumark-theme` | `settings/page.tsx:346`, `layout.tsx:23` | `{darkMode, accentColor, language}` | ✅ UI preference only | None — no business data |
| `blumark_session` cookie | `AuthContext.tsx:44` | `"1"` (presence marker) | ✅ Auth hint only | Low — middleware uses this as fallback |

**No business data, PII, or system state is stored in localStorage.** Theme preference is the only use and is acceptable.

---

## Final Production Readiness Score Breakdown

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Auth & Session | 13 | 20 | Role hydration bug; middleware gap; fallback demotes to employee |
| RBAC & Permissions | 14 | 20 | Logic is correct; automation RLS mismatch; sidebar label wrong |
| Data Persistence | 10 | 20 | Core CRUD solid; invoices/expenses dead; automation simulated |
| Security & DevOps | 9 | 15 | Good foundations; hardcoded emails; no rate limiting; migration drift |
| UI/UX / Mobile | 6 | 10 | RTL solid; sidebar role label bug; no language switching |
| Automation | 0 | 15 | Fully simulated; zero real backend execution |
| **TOTAL** | **52** | **100** | |

---

## I. Final Codex Repair Prompt

```
You are a senior full-stack engineer performing a production-grade repair on the Blumark24 OS
codebase (Next.js 14 App Router + Supabase + TypeScript + Tailwind).

## ABSOLUTE CONSTRAINTS
- DO NOT redesign any UI component, layout, or page structure.
- DO NOT change any color scheme, branding, or visual design.
- DO NOT implement organizations or multi-tenancy features.
- DO NOT modify database schema structure beyond what is explicitly specified below.
- DO NOT rename any existing pages, routes, or navigation items.
- Make only the minimal surgical changes required to fix each defect.

## CONTEXT
The repository has been audited. The following defects must be fixed in phases.
Read each file fully before editing. After each phase, run `tsc --noEmit` to verify no type errors.

---

## PHASE 1: AUTH / RBAC ROLE DISPLAY + HYDRATION (Priority: CRITICAL)

### Fix 1.1 — Sidebar role label (D-02)
File: `src/components/layout/Sidebar.tsx`
Current (line ~162):
  <div className="text-xs text-[#8ba3c7] truncate">{userRole.replace(/_/g, " ")}</div>
Required:
  - Import `ROLE_LABELS` from `@/contexts/PermissionsContext` at the top of the file.
  - Change the line to: `{ROLE_LABELS[userRole] ?? userRole.replace(/_/g, " ")}`
  - This fixes Arabic label display in the sidebar footer for all roles.

### Fix 1.2 — Remove client-side profile upsert fallback (D-05)
File: `src/contexts/AuthContext.tsx`
Current (lines ~79-94): If profile not found, upserts a default row with `role: 'employee'`.
Required:
  - Remove the upsert block entirely.
  - Replace with: log the error to console and return a safe user object WITHOUT upsert:
    ```typescript
    if (!profile) {
      console.error("[buildUser] Profile not found for", email, id);
      return {
        id,
        email,
        name: email.split("@")[0],
        role: "employee",
        forcePasswordChange: false,
      };
    }
    ```
  - DO NOT upsert. Profile creation must only happen server-side via `/api/admin/create-user`.

### Fix 1.3 — Remove non-existent `full_name` from FULL_COLS (D-12)
File: `src/contexts/AuthContext.tsx`
Current (line ~53):
  `const FULL_COLS = "name, full_name, role, avatar, avatar_url, email, force_password_change";`
Required:
  - Remove `full_name` from FULL_COLS. The column does not exist in the schema.
  - Change to: `const FULL_COLS = "name, role, avatar, avatar_url, email, force_password_change";`
  - Update the `displayName` derivation (line ~97) to remove `profile?.full_name` reference.

### Fix 1.4 — Update stale UserRole type (D-07)
File: `src/types/index.ts`
Current line 1: `export type UserRole = "مدير_عام" | "مدير_مالي" | "مدير_مبيعات" | "مدير" | "موظف";`
Required:
  - Replace with: `export type UserRole = "super_admin" | "board_member" | "defense_manager" | "attack_manager" | "finance_manager" | "employee";`
  - Update `User.role` field to use the new canonical type.
  - After the change, run `tsc --noEmit` and fix any type errors that arise from the old enum usage in components.

### Fix 1.5 — Data fix (D-01) — Document in migration
Create a new file: `supabase/migrations/007_promote_admin_users.sql`
Content:
  ```sql
  -- Promote j3b.ksa@gmail.com to super_admin.
  -- Run this manually in Supabase Dashboard → SQL Editor after confirming the email.
  UPDATE public.profiles
  SET role = 'super_admin',
      department = 'الإدارة العليا',
      is_active = true
  WHERE email = 'j3b.ksa@gmail.com';

  -- Verify:
  -- SELECT id, email, role FROM public.profiles WHERE email = 'j3b.ksa@gmail.com';
  ```

### Acceptance Tests for Phase 1
1. Log in as `j3b.ksa@gmail.com` → Header shows `مدير أعلى` in profile dropdown.
2. Sidebar footer shows `مدير أعلى` (not "super admin" or "موظف").
3. Hard-refresh the page → role remains `مدير أعلى`.
4. Log in as an employee → Sidebar shows `موظف`, navigation filtered correctly.
5. `tsc --noEmit` passes with zero errors.

---

## PHASE 2: PERSISTENCE / SAVE FLOWS (Priority: HIGH)

### Fix 2.1 — Automation RLS mismatch (D-04)
Create a new file: `supabase/migrations/008_automation_rls_fix.sql`
Content:
  ```sql
  -- Allow defense_manager to toggle automations (they have manage_automations permission).
  DROP POLICY IF EXISTS "automations: super_admin write" ON public.automations;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'automations'
        AND policyname = 'automations: manager write'
    ) THEN
      CREATE POLICY "automations: manager write"
        ON public.automations FOR ALL
        USING (
          public.get_my_role() IN ('super_admin', 'defense_manager')
        );
    END IF;
  END $$;
  ```

### Fix 2.2 — Remove dead finance service OR stub tables (D-03, D-11)
Option A (recommended if invoices/expenses are not in the product yet):
  - Delete `src/lib/services/finance.ts` entirely.
  - No page imports it; it is safe to remove.

Option B (if invoices/expenses should be real):
  Create `supabase/migrations/009_invoices_expenses.sql` with:
  ```sql
  CREATE TABLE IF NOT EXISTS public.invoices (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   TEXT NOT NULL DEFAULT '',
    client_name TEXT NOT NULL DEFAULT '',
    amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'مسودة'
                  CHECK (status IN ('مسودة','مرسلة','مدفوعة','متأخرة')),
    due_date    TEXT NOT NULL DEFAULT '',
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "invoices: authenticated read"
    ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY "invoices: finance write"
    ON public.invoices FOR ALL
    USING (public.get_my_role() IN ('super_admin', 'finance_manager'));

  CREATE TABLE IF NOT EXISTS public.expenses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category    TEXT NOT NULL DEFAULT '',
    amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    date        TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "expenses: authenticated read"
    ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
  CREATE POLICY "expenses: finance write"
    ON public.expenses FOR ALL
    USING (public.get_my_role() IN ('super_admin', 'finance_manager'));
  ```
  Then update `src/lib/services/finance.ts` to remove `any` types with proper interfaces.

### Fix 2.3 — Fix addManagedUser userId (D-09)
File: `src/contexts/PermissionsContext.tsx`
Current (line ~280): `userId: Date.now().toString()`
Required:
  - The `addManagedUser` function should only be called with a real server-returned userId.
  - Update the caller site(s) (employees page create flow) to pass the `id` returned from the API.
  - Change `addManagedUser` signature to require `userId` as a parameter (remove the default).

### Fix 2.4 — Add audit logging to admin API routes (D-14)
Files: `src/app/api/admin/create-user/route.ts`, `update-user/route.ts`, `delete-user/route.ts`
Required:
  - After each successful operation, call `logActivity()` via a fire-and-forget pattern.
  - Example in create-user route after success:
    ```typescript
    // Fire-and-forget activity log (do not await — don't fail the request on log error)
    void supabaseAdmin.from("activities").insert({
      type: "employee",
      description: `تم إنشاء مستخدم جديد: ${name} (${email})`,
      icon: "👤",
    });
    ```

### Acceptance Tests for Phase 2
1. As `defense_manager`: toggle an automation ON/OFF → change persists after page refresh.
2. All CRUD operations on Employees, Tasks, Clients, Transactions → verify data survives hard refresh.
3. `finance.ts` is either deleted or tables exist and service returns real data.
4. Create a new user via the employees page → `addManagedUser` uses the real UUID from the API response.
5. Admin actions appear in the Activities feed.

---

## PHASE 3: AUTOMATION HARDENING (Priority: MEDIUM)

### Fix 3.1 — Document simulation mode clearly
File: `src/app/automation/page.tsx`
Required:
  - Add a visible UI banner in the automation page (below the page title, above the stats cards):
    ```tsx
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-center gap-2">
      <AlertTriangle size={14} />
      وضع المحاكاة — التنفيذ يعمل محلياً فقط. لا توجد مهام مجدولة على الخادم حتى الآن.
    </div>
    ```
  - DO NOT change any logic, just add the banner below the `<h1>` block.

### Fix 3.2 — Late task detection should write to DB when run (D-08, partial)
File: `src/app/automation/page.tsx`
The `runLateTaskDetection` function currently only counts tasks. Update it to also mark late tasks:
  ```typescript
  async function runLateTaskDetection(tasks: Task[], supabase: SupabaseClient) {
    const lateTasks = tasks.filter(
      (t) => t.status !== "مكتملة" && new Date(t.dueDate) < new Date()
    );
    if (!lateTasks.length) return { result: "لا توجد مهام متأخرة 🎉", status: "success" as const };
    // Actually update DB
    const ids = lateTasks.map((t) => t.id);
    await supabase.from("tasks").update({ status: "متأخرة" }).in("id", ids);
    return { result: `تم تحديث ${lateTasks.length} مهمة كـ "متأخرة"`, status: "warning" as const };
  }
  ```
  Update the `runnerFor` function to pass `supabase` client and await the updated function.

### Fix 3.3 — Task reminder creates real notifications
File: `src/app/automation/page.tsx`
When `task-reminder` runs, insert real notifications:
  ```typescript
  async function runTaskReminder(tasks: Task[], supabase: SupabaseClient) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcoming = tasks.filter(
      (t) => t.status !== "مكتملة" && new Date(t.dueDate) <= tomorrow && new Date(t.dueDate) > new Date()
    );
    if (!upcoming.length) return { result: "لا توجد مهام قريبة الاستحقاق", status: "success" as const };
    await Promise.all(upcoming.map((t) =>
      supabase.from("notifications").insert({
        type: "task_due",
        title: "تذكير: مهمة قريبة",
        body: `المهمة "${t.title}" تستحق خلال 24 ساعة`,
        href: "/tasks",
      })
    ));
    return { result: `أُنشئت ${upcoming.length} إشعار تذكير`, status: "success" as const };
  }
  ```

### Acceptance Tests for Phase 3
1. Automation page shows simulation mode banner.
2. Running "Late Tasks" rule marks overdue tasks as `متأخرة` in DB (verify in Supabase table editor).
3. Running "Task Reminder" rule inserts notifications visible in the header bell icon.
4. `run_count` increments and `last_run` updates for every rule that runs.
5. Automation log shows correct result text and status.

---

## PHASE 4: FINAL QA HARDENING (Priority: LOW-MEDIUM)

### Fix 4.1 — Consolidate admin emails to env (D-10)
Create `src/lib/adminConfig.ts`:
  ```typescript
  export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  ```
  Update all three API routes to import and use `ADMIN_EMAILS` from `@/lib/adminConfig`.
  Add `ADMIN_EMAILS=blumark24@gmail.com,blumark.sa@gmail.com` to `.env.local.example`.

### Fix 4.2 — Consolidate migration files
  - Rename/archive duplicate `002_*.sql` and `001_*.sql` files. Keep only one canonical sequence.
  - Ensure `supabase/final-production-schema.sql` is explicitly marked as the authoritative single-run setup.
  - Add a `README` comment at the top of `final-production-schema.sql` explaining the migration order.

### Fix 4.3 — Remove language from localStorage theme key (D-13)
File: `src/app/settings/page.tsx`
  - Remove `language` from the object written to `localStorage['blumark-theme']`.
  - If language switching is planned, it requires a separate implementation. Do not store unused keys.

### Final Acceptance Tests
1. Full regression: login as each role, verify sidebar, header, nav all show correct Arabic labels and correct menu items.
2. Create/Edit/Delete one of each: employee, task, client, transaction → verify DB persists.
3. Toggle automation ON/OFF as super_admin and as defense_manager → verify both persist.
4. Run "Late Tasks" automation → verify DB updated.
5. Hard refresh on every page → no role regression, no data loss.
6. Verify `tsc --noEmit` passes with zero errors.
7. Open on mobile viewport (375px) → sidebar overlay works, nav accessible.
8. Verify no console errors on dashboard page load.
```

---

*End of Audit Report — Issue #37*
*All findings are based on static code analysis and schema review. No code was modified during audit.*
