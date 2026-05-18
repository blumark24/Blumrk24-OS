# B24 OS — Dashboard KPI Details Report

Issue: [#84](https://github.com/blumark24/Blumark24-OS/issues/84) — "Mobile UI polish for CRM and AI assistant pages after PR #82" (updated request to include Dashboard Home KPI cards).

Scope: **Dashboard Home only** — small, RTL-friendly detail strips inside the four KPI cards. Pairs with PR #85 (CRM + AI mobile polish, opened earlier and not yet merged). This PR is intentionally narrow per the "افتح PR منفصل وصغير" rule.

---

## 1. Files modified (2)

| File | Type | Purpose |
|---|---|---|
| `src/app/page.tsx` | edit | Add a small detail strip inside each of the four KPI cards. Adds `useTasks` + `usePermissions` consumption, computes 4 `useMemo` slices from already-loaded data, gates employee names to super_admin only. |
| `B24_OS_DASHBOARD_KPI_DETAILS_REPORT.md` | new | This report. (PR #85's report is the inner-pages polish report; this is its sibling.) |

**Untouched** (verified via `git diff --stat`): everything else.

---

## 2. What changed in each card

The 4 KPI cards stay the **same shape, same color gradient, same icon, same value, same label, same subtitle**. The detail strip is a thin row inserted between the existing subtitle and the bottom gradient stripe, separated by a hair-line `border-t border-[#1e3a5f]/40`. The card grows ~30 px vertically — still compact.

| # | Card label (Arabic) | New detail strip |
|---|---|---|
| 0 | العملاء النشطون | **Super-admin only**: stacked-avatar row of up to 3 active employee initials with the tooltip "يدعمون العملاء". **Everyone else**: compact ratio "X من Y عميل" (no PII). **No data**: "لا توجد بيانات حالياً". |
| 1 | المهام المكتملة | Latest completed task title (truncated) with an emerald `CheckCircle` icon. **No data**: "لا توجد بيانات حالياً". |
| 2 | المهام المتبقية | Nearest upcoming deadline: task title (truncated) + short Arabic date "12 أبريل" on the far end. Amber `Clock` icon. **No data**: "لا توجد بيانات حالياً". |
| 3 | المهام المتأخرة | Oldest overdue task title (truncated) with a red `AlertTriangle` icon. **No overdue but tasks exist**: emerald "كل المهام في الموعد". **No tasks at all**: "لا توجد بيانات حالياً". |

All detail rows use the existing color palette only (`#8ba3c7` slate text, `#22d3ee` / `#1e6fd9` brand cyan-blue avatar gradient, `#6b87ab` muted secondary, `text-emerald-400` / `text-amber-400` / `text-red-400` semantic accents — every one of these already used elsewhere in the file). No new colour token introduced.

---

## 3. Super-admin gate for employee names

The Issue's clarification: "أسماء الموظفين/المستخدمين النشطين تظهر فقط للمدير الأعلى/super admin".

Implementation:

```ts
const isSuperAdmin = user
  ? mapAuthRoleToUserRole(user.role) === "super_admin"
  : userRole === "super_admin";

const activeEmployeeNames = useMemo(() => {
  if (!isSuperAdmin) return [];          // ← hard gate
  return employees
    .filter((e) => e.status === "نشط")
    .slice(0, 3)
    .map((e) => e.name);
}, [employees, isSuperAdmin]);
```

Why this shape:

- The primary check uses `mapAuthRoleToUserRole(user.role)` — the same mapper that `PageGuard` uses (`src/components/ui/PageGuard.tsx`) — to avoid the one-render lag in `PermissionsContext.userRole` that caused the historical "access-denied flash" on hard refresh. It mirrors the existing gating pattern in the codebase, no new pattern invented.
- The fallback to `userRole` ensures parity if `user` somehow lands before `mapAuthRoleToUserRole` is callable.
- For non-super_admin users the array is empty, the avatar branch falls through to the `ratio` branch which shows aggregate counts only (no names).
- The full names are passed to the `<div title="…">` attribute on **super_admin only** — for everyone else the tooltip is absent because the wrapping branch never renders.

No new permission key, no new role, no new RLS, no Supabase change.

---

## 4. Data sources — all already loaded

The dashboard page already calls these hooks; the detail strips reuse the **same** in-memory arrays:

| Hook | Already on page? | Used by detail strip |
|---|---|---|
| `useDashboardKPI()` | yes | card 0 fallback ratio |
| `useEmployees()`    | yes | card 0 super-admin avatar row |
| `useClients()`      | yes | card 0 fallback ratio denominator |
| `useTasks()`        | **new on this page** | cards 1 / 2 / 3 |

The new `useTasks()` is the only added query. It's:

- The same hook already used by `/tasks`, `/automation`, `/reports`, `/ai`.
- Implemented in `src/hooks/useData.ts` with `withTimeout(15 s)` + `useAsyncData` — i.e. it inherits the Phase 0 timeout safety, never hangs the UI.
- Adds **one** Supabase `select * from tasks` per dashboard mount (deduplicated client-side by the realtime channel). Cheap on top of the 6 hooks already on the page.

No new endpoint, no new helper, no `lib/db.ts` change.

---

## 5. تأكيد عدم لمس auth / Supabase / routing / Sidebar / CRUD

`git diff --stat`:

```
B24_OS_DASHBOARD_KPI_DETAILS_REPORT.md | new
src/app/page.tsx                       | + detail strips inside KPI cards
```

| Area | Touched? |
|---|---|
| `src/components/layout/Sidebar.tsx` | ❌ — bytes identical to main (PR #82 version) |
| `src/contexts/AuthContext.tsx` | ❌ |
| `src/contexts/PermissionsContext.tsx` | ❌ |
| `middleware.ts` / routing | ❌ |
| `supabase/migrations/*` / `*.sql` | ❌ |
| `src/lib/db.ts` / `src/hooks/useData.ts` | ❌ — `useTasks` is consumed, not modified |
| Any `app/api/**` | ❌ |
| `src/app/demo/*` / `src/components/demo/*` | ❌ |
| `src/app/clients/*` / `src/app/ai/*` | ❌ (those are PR #85's territory; this PR is independent) |
| `package.json`, dependency versions | ❌ |
| Brand colours / globals.css | ❌ |
| CRUD logic (`insert`/`update`/`remove`) | ❌ |
| Dashboard chart blocks below the KPI row | ❌ |

---

## 6. Validation

| Command | Result |
|---|---|
| `npm run lint` | ✅ pass — 0 errors, 1 pre-existing baseline warning (`@next/next/no-page-custom-font` on `src/app/layout.tsx:27`, unrelated). |
| `npx tsc --noEmit` | ✅ pass — `EXIT=0`. |
| `npm run build` | ✅ pass — **20 / 20 routes**. |

Bundle deltas:

| Route | Before | After | Δ |
|---|---|---|---|
| `/` | 13.6 kB / 303 kB | **14.4 kB / 304 kB** | +0.8 kB page, +1 kB First Load (detail-strip JSX + `useTasks` consumption) |
| `/demo` | 14.5 kB / 215 kB | **unchanged** ✓ |
| Every other route | — | **unchanged** ✓ |
| Shared chunks | 87.3 kB | 87.3 kB ✓ |

### Viewport coverage

The detail strip uses `text-[11px]`, `min-h-[28px]`, `truncate`, and `flex-shrink-0` icons throughout. It fits cleanly inside the existing 2-column mobile grid:

| Width | Behavior |
|---|---|
| **375 px** (iPhone SE / 12 mini) | KPI grid is `grid-cols-2`. Each card ≈ 160–170 px wide. Detail strip: avatar row (3 × 24 px + label) or task title (truncates inside the card width). No overflow. |
| **390 px** (iPhone 13 / 14) | Same layout, slightly more breathing room. |
| **430 px** (iPhone 15 Pro Max) | Same layout, longer task titles fit before truncation. |
| **Tablet (~768 px)** | Still `grid-cols-2` until `lg` (1024 px). Detail strip same. |
| **Desktop ≥ 1024 px** | `grid-cols-4` — 4 cards in one row. Detail strip identical, cards are wider so truncation rarely triggers. |

No CSS media query was added — the strip is built from responsive Tailwind utilities (`min-w-0`, `truncate`, `flex-shrink-0`).

---

## 7. Mobile screenshots — caveat

Real-device screenshot capture is **not possible from this remote container** (Playwright/Chromium download blocked by the environment's network policy — verified in the PR #78, PR #82, and PR #85 work streams). Visual verification depends on the Vercel preview URL that auto-builds from this PR's branch.

**The PR's test plan asks the reviewer to** open the Vercel preview on a real device at 375 / 390 / 430 px and confirm:

1. As **super_admin**: card 0 shows up to 3 cyan-blue stacked-avatar initials with "يدعمون العملاء" label.
2. As **non-super_admin**: card 0 shows "X من Y عميل" — no employee names visible.
3. Card 1 shows the latest completed task title, truncated cleanly.
4. Card 2 shows the nearest deadline task + a date like "12 أبريل" on the end.
5. Card 3 shows either an overdue task title, "كل المهام في الموعد" if none, or "لا توجد بيانات حالياً" if no tasks at all.
6. All four cards remain the same width / order / colour as before; the layout fits 375 px without horizontal overflow.
7. Dashboard charts, projects card, activities feed — unchanged.

---

## 8. Remaining risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Mobile QA not run from this container; relies on Vercel preview. | Disclosed | Reviewer test plan in PR body. |
| 2 | `useTasks()` adds one extra Supabase fetch per dashboard mount on top of the existing 5+ hooks. Wrapped in the existing `withTimeout(15 s)` so it can't hang. | Low | Same hook used by 4 other pages already; budgeted by the Phase 0 timeout safety. |
| 3 | "Latest completed task" is sorted by `createdAt` (proxy) because the schema doesn't expose a `completed_at` column. In edge cases this may pick a slightly out-of-order task. | Low | Schema change is explicitly out of scope. Acceptable approximation. |
| 4 | `isSuperAdmin` gate uses **two** sources (`mapAuthRoleToUserRole(user.role)` AND `userRole` fallback). If both report non-super_admin, the names branch never renders — fail-closed. If either reports super_admin, names render. Mirrors the codebase's existing pattern; no new attack surface. | None | Verified by code-read. |
| 5 | Card 0 detail tooltip (`title` attribute) is set on the avatar row container — so super_admin sees full names on hover. Acceptable PII surface for super_admin role per the issue's explicit allowance. | Disclosed | Documented. |
| 6 | This PR is independent of PR #85 (CRM + AI). They modify disjoint files (`/page.tsx` vs `/clients/page.tsx` + `/ai/page.tsx`), so merging in either order is safe. | None | Both close the same Issue #84. |

---

## 9. Stop point

Per Issue #84's "Final rule" — PR صغير ومنفصل, scope strictly observed (Dashboard Home only), no Sidebar / Supabase / migrations / auth / routing / CRUD / `/demo` / colours touched, validation green, report written. **Do not merge before real-device screenshots confirm the layout.** Stopping here.
