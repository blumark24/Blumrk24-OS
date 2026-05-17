# `/demo` — Dashboard Demo Audit

## What was built

A new public sales demo at `/demo` that mirrors the supplied reference image as closely as possible: a 3-zone dashboard layout (right sidebar + center dashboard + left brand panel) wrapped in dark navy glassmorphism with cyan/blue/orange gradient accents. All data is in-file static dummy data — no Supabase, no auth, no API, no localStorage.

The image is the source of truth — every visible region in the reference has a dedicated component, and the RTL DOM ordering is intentional so each region lands on the correct visual side.

## File layout

| File | Role |
|---|---|
| `src/app/demo/page.tsx` | Tiny entrypoint, server component, just renders `<DemoDashboardPage />` |
| `src/components/demo/DemoDashboardPage.tsx` | Top-level composer: background ambient lighting, mobile sticky header + right drawer, responsive 3-zone grid, bottom CTA |
| `src/components/demo/DemoTopBar.tsx` | Desktop-only top bar — `lg+` shows it; mobile/tablet replace it with the sticky header in the page |
| `src/components/demo/DemoSidebar.tsx` | Right nav: logo on top, 9 nav rows with active state for "الرئيسية", user card pinned at the bottom |
| `src/components/demo/DemoKpiRow.tsx` | 4 KPI cards with brand-gradient icon tiles, hover lift, hover glow |
| `src/components/demo/DemoOverviewRow.tsx` | Welcome card (jellyfish glow) + Satisfaction gauge (95%) + Referral card (4.8/5) — DOM order reversed for RTL so the visual order matches the image (Welcome left, Sat middle, Ref right) |
| `src/components/demo/DemoChartsRow.tsx` | Sales `AreaChart` (12 months, 2 series, dashed previous-year, brand cyan area) + Users `BarChart` (5 buckets, brand gradient bars). Recharts is used for real interactivity (tooltips, axis ticks, responsive container) |
| `src/components/demo/DemoProjectsTable.tsx` | Active projects table — overflow-x-auto inside the card (`min-w-[640px]`) so the page itself never scrolls horizontally on mobile |
| `src/components/demo/DemoActivityFeed.tsx` | Vertical activity list with icon tiles + an "عرض جميع النشاطات" footer button |
| `src/components/demo/DemoBrandPanel.tsx` | Left panel: official transparent logo + AI-gradient headline + description + 4 feature pills + hand-drawn tablet/phone mockups + `Blumark24.com` link, on top of a jellyfish glow background |
| `src/components/demo/DemoBottomCta.tsx` | 5-feature horizontal CTA bar + brand gradient CTA button linking to `/auth` |
| `src/components/demo/Jellyfish.tsx` | Shared hand-rolled SVG jellyfish (bell + tentacles + blur filter), `variant: "card" | "panel"` for size/intensity |
| `src/data/demo-dashboard.ts` | All dummy data (nav, KPIs, sales series, users series, activities, projects, brand features, bottom features, user) plus shared types |

`src/app/page.tsx` was not modified in this PR — it still points at `DemoDashboardLanding` from the previous PR.

## Reference → implementation map (image is source of truth)

| Reference element | Implementation |
|---|---|
| Right sidebar (Blumark24 logo + 9 nav items + Ahmed Mohammed user card with online dot) | `DemoSidebar` — exact 9 items, active highlight on "الرئيسية" with cyan gradient + glow |
| Top bar (search + settings on visual right, `+` / sun / bell-with-5 / mail / avatar on visual left) | `DemoTopBar` — DOM ordered so first child (search + settings) lands on the visual right in RTL, last child (icon cluster) lands on the visual left; bell carries a `5` orange badge |
| 4 KPI cards across the top | `DemoKpiRow` — same 4 KPIs (الموظفون النشطون / المهام المكتملة / إيرادات هذا الشهر / إجمالي العملاء), revenue card uses the warning gradient (`#FF7A3D → #FFB066`) per the orange icon in the reference, all others use the brand tri-gradient |
| Welcome card with jellyfish glow ("مرحباً أحمد" + role + today + tag line) | `DemoOverviewRow.WelcomeCard` + `Jellyfish` SVG positioned absolute-right inside the card |
| 95% satisfaction half-circle gauge with "ممتاز" label and "+5%" delta | `DemoOverviewRow.SatisfactionGauge` — SVG semi-circle, brand gradient stroke, dynamic `strokeDasharray` |
| 4.8/5 referral card with stars and total referrals | `DemoOverviewRow.ReferralCard` — lucide `Star` icons filled per rating + total row at the bottom |
| Sales line chart (last 12 months, two-series with dashed previous year) | `DemoChartsRow.SalesChart` — Recharts `AreaChart`, gradient area fill, dashed white previous-year area, tooltips in Arabic |
| Active users bar chart (last 30 days, 5 buckets) | `DemoChartsRow.UsersChart` — Recharts `BarChart` with rounded-top bars, brand gradient fill |
| Active projects table | `DemoProjectsTable` — 5 rows, "مكتمل" emerald pill, "قيد التنفيذ" cyan pill, progress bars use brand gradient (or emerald for 100%) |
| Recent activities feed on the right | `DemoActivityFeed` — 5 entries, icon tiles, time stamps, "عرض جميع النشاطات" footer button |
| Left brand panel (logo + AI gradient headline + description + 4 feature pills + jellyfish + tablet+phone mockups + Blumark24.com URL) | `DemoBrandPanel` + `DeviceMockups` |
| Bottom CTA bar (5 features on the visual left + "ابدأ رحلتك مع Blumark24 OS" + gradient demo CTA on the visual right) | `DemoBottomCta` — uses CSS `order` so the features stack first on mobile and sit to the visual left on `lg+`, while the CTA pinned to the visual right |

## Responsive plan

Tested by Tailwind-class analysis against the requested target widths:

| Width | Layout |
|---|---|
| **390 px (mobile)** | Sticky top header with logo + hamburger; nav drawer opens from the right with the full Sidebar inside. Main column stacks: KPIs 2×2 → Welcome stacked over Sat / Ref → Charts each full-width → Projects table (horizontal scroll inside its glass card, page itself never scrolls) → Activity feed → Brand panel (full-width card) → Bottom CTA (CTA full-width + 2-col features). |
| **768 px (tablet)** | Same single-column stack as mobile but search bar hidden; Overview row uses 2-col on `md` (Ref + Sat on row, Welcome spans both columns); Charts row still stacked. Sidebar still in the right drawer. Bottom CTA features 3-col. |
| **1024 px (laptop / lg)** | **Full 3-zone grid** `[240px][1fr][280px]` (right sidebar / center / left brand). Top bar visible (replaces the mobile sticky header). KPIs 4-col. Overview row uses `[1fr_1fr_1.5fr]` so Welcome is the widest. Inside the center, Charts + Activity row splits into `[280px][1fr]` so Activity hugs the right and charts + projects fill the left. Sidebar uses `lg:sticky lg:top-4` for a parallax feel. |
| **1440 px (desktop)** | Wider gutters via `max-w-[1600px] mx-auto`. Grid becomes `[260px][1fr][320px]` and inner row becomes `[320px][1fr]`. |
| **1920 px (large)** | Same as 1440 px — the `max-w-[1600px]` cap keeps the layout from over-stretching on very wide screens; ambient lighting fills the surrounding space. |

Containment safety:
- Root: `overflow-x-hidden`.
- `min-w-0` on every inner column/section to defeat flex/grid intrinsic-width blow-outs in RTL.
- `truncate` / `line-clamp-2` on dynamic text.
- The only horizontally scrollable element is the projects table, and it scrolls **inside its own glass card** via `overflow-x-auto` — the page itself never scrolls horizontally.

## Interactions

- KPI cards: hover lift + cyan radial glow + icon scale-up.
- Overview cards / Activity items / Bottom CTA features: hover background and border tint.
- Sidebar nav rows: active state highlighted with brand gradient + cyan arrow; non-active rows hover into a faint white background.
- Charts: Recharts tooltips (Arabic labels, glass background, brand cyan text) + active dot on hover for the sales chart + bar cursor highlight for the users chart.
- Buttons: gradient brightness on hover, shadow grows on the primary CTA, arrow translates -0.5 on hover.
- Mobile drawer: backdrop blur fades in, drawer slides in from the right (RTL), close button + click-outside both work, body scroll locks while open.
- All `title` attributes provide a native browser tooltip on interactive cards, satisfying the "tooltips بسيطة عند الحاجة" requirement.

## Scope guarantees

| Area | Touched? |
|---|---|
| `src/contexts/AuthContext.tsx` | **NO** |
| Supabase client / RLS / policies / migrations | **NO** |
| Dashboard / Tasks / Employees / Finance / Strategy / Reports / Org / Settings page logic | **NO** |
| API routes (`src/app/api/**`) | **NO** |
| `save` / `delete` / `create` flows | **NO** |
| `OfficialBlumarkLogo` component / brand PNG | **NO** (reused as-is) |
| Existing `LandingPage.tsx` / `HeroVisual.tsx` / `DemoDashboardLanding.tsx` | **NO** |
| `src/app/page.tsx` | **NO** |
| `localStorage` / browser storage | **NO** |
| New dependencies | **NONE** — Recharts and lucide-react are already in `package.json` |
| External images / fonts / videos / canvas | **NONE** |

## Validation

```
npx tsc --noEmit   → clean, no output
npm run lint       → only the pre-existing no-page-custom-font
                     warning in src/app/layout.tsx (unrelated)
npm run build      → succeeds, 20/20 routes prerendered
                     /demo  →  14.5 kB / 215 kB First Load JS
```

## Safe to merge?

**YES.** All new files live under `src/components/demo/`, `src/data/demo-dashboard.ts`, and a one-line `src/app/demo/page.tsx`. No business logic / auth / Supabase / RLS / API / save-delete-create flow was touched. Build / typecheck / lint pipeline clean.
