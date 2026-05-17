# Marketing Landing (`/`) — Audit

## What was built

A new standalone marketing landing at `/`, separate from the interactive sales demo at `/demo`. The marketing landing shares the **same visual identity** as `/demo` (dark navy background, glassmorphism cards, cyan/blue/orange gradients, jellyfish glow, RTL Arabic) but presents the product as a marketing site — not a dashboard preview.

The path `/demo` was not modified.

## Files modified

| File | Change |
|---|---|
| `src/components/landing/MarketingLanding.tsx` | **New.** Full marketing landing: sticky scroll-aware header, hero with dual CTAs, Why section, Features section, How-it-works section, Audience section, Final CTA, minimal footer. Reuses `Jellyfish` from `src/components/demo/Jellyfish.tsx` so the glow vocabulary matches `/demo` exactly. |
| `src/app/page.tsx` | One-line import swap: `LandingPage` alias now resolves to `MarketingLanding` instead of the previous `DemoDashboardLanding`. The existing `if (!user) return <LandingPage />` call site is unchanged. |
| `docs/MARKETING_LANDING_AUDIT.md` | **New.** This audit. |

`src/components/demo/*` and `src/app/demo/page.tsx` were intentionally not touched.

## Section map

| # | Section | Anchor | What it contains |
|---|---|---|---|
| 1 | **Sticky glass header** | `#home` | Logo (left on `<lg`, right on `lg+` to match `/demo`'s flow), nav anchors, login link, `شاهد الديمو` glass button → `/demo`, gradient `طلب عرض تجريبي` CTA → `/auth` |
| 2 | **Hero** | `#home` | Animated cyan ping eyebrow chip carrying `Blumark24 OS`, gradient h1 `نظام إدارة الأعمال بالذكاء الاصطناعي`, subtitle exactly as specified, primary CTA `اطلب عرض تجريبي` + secondary CTA `شاهد الديمو` (links to `/demo`), trust bullets, and two `Jellyfish` glow accents positioned in the background corners |
| 3 | **لماذا Blumark24 OS** | `#why` | 4 glass cards (RTL-first / unified ops / AI-assisted decisions / enterprise security) with brand-gradient icon tiles |
| 4 | **المزايا الرئيسية** | `#features` | 6 feature cards (Employees / Tasks / CRM / Finance / Reports / Automation) in a 1 → 2 → 3 column grid |
| 5 | **كيف يعمل النظام** | `#how` | 3 numbered steps (`الخطوة 01–03`): start in minutes → connect teams & modules → let AI + automation work |
| 6 | **لمن مناسب** | `#audience` | 4 audience cards (startups / agencies / ops & services / executive teams). Uses the orange gradient `#FF7A3D → #FFB066` on the icon tiles to mirror the warning/revenue accent from `/demo` |
| 7 | **Final CTA** | `#contact` | Premium glass card (rounded-3xl, two corner glow blobs, faint grid overlay, jellyfish on the right) with both CTAs and trust bullets |
| 8 | **Minimal footer** | — | Single horizontal row: logo + AI pill + 4 anchors (including `شاهد الديمو` → `/demo`) + copyright |

## Visual identity (matches `/demo`)

| Token | Value |
|---|---|
| Body bg | `#050816` + `radial-gradient(ellipse_at_top,#0F172A,#0A1628_45%,#050816)` ambient layer |
| Card surface | `bg-[rgba(10,22,40,0.55)] backdrop-blur-xl` |
| Card border (default) | `border-white/[0.08]` |
| Card border (hover) | `border-white/[0.16]` |
| Muted text | `rgba(255,255,255,0.72)` (with `0.55` / `0.45` for finer hierarchy) |
| Brand gradient | `bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE]` — used on h1 highlight, primary CTA, icon tiles |
| Orange accent | `#FF7A3D → #FFB066` on audience icon tiles |
| Jellyfish | Shared SVG imported from `src/components/demo/Jellyfish.tsx` (both `variant="card"` and `variant="panel"`) |
| Container | `max-w-[1440px] mx-auto` |
| Section rhythm | `py-20 sm:py-24 lg:py-32` (matches `/demo`'s bottom CTA spacing) |
| Font stack | `'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif` |

## Responsive plan (target widths)

| Width | Layout |
|---|---|
| **390 px (mobile)** | Sticky glass header with logo left + hamburger right (`flex-row-reverse`); drawer holds nav + 3 CTAs (شاهد الديمو / تسجيل / طلب عرض). Hero CTAs full-width, h1 34 px. Why 1-col, Features 1-col, How 1-col, Audience 1-col, Final CTA centered. Trust bullets wrap. |
| **768 px (tablet, sm)** | Same compact header. Hero CTAs side-by-side. Why 2-col, Features 2-col, How 3-col (md kicks in), Audience 2-col. |
| **1024 px (lg)** | Full nav visible in the header along with `شاهد الديمو` glass button + gradient demo CTA. h1 60 px. Why 4-col, Features 3-col, How 3-col, Audience 4-col. Hero glows + jellyfish accents render at full opacity. |
| **1440 px** | Same as 1024 with wider gutters via `max-w-[1440px] mx-auto`. |
| **1920 px** | The `max-w-[1440px]` cap centers content so the layout doesn't over-stretch; ambient lighting fills the surrounding negative space. |

Containment safety: root `overflow-x-hidden`, `min-w-0` on every flex/grid column, `truncate` / `line-clamp-2` on dynamic text. No horizontal scroll at any tested width.

## Interactions

- Sticky header transitions from soft glass to opaque blur with a shadow once the user scrolls past 12 px (`transition-all duration-300`).
- Cards: hover lift + brightness + radial glow blob fading in from the top-left (only on Why cards) or icon scale-up (Why icon tile).
- Nav anchors and footer links highlight to full white on hover.
- Buttons: gradient brightness + shadow grow + arrow icon translates -0.5 on hover.
- Mobile drawer: backdrop blur, smooth opacity fade, click-outside + X both close, body scroll locks while open.

## Scope guarantees

| Area | Touched? |
|---|---|
| `src/app/demo/page.tsx` and `src/components/demo/*` | **NO** (reused `Jellyfish` via import only) |
| `AuthContext`, Supabase, RLS, policies, migrations | **NO** |
| Dashboard / Tasks / Employees / Finance / Strategy / Reports / Org / Settings page logic | **NO** |
| API routes (`src/app/api/**`), `save` / `delete` / `create` flows | **NO** |
| `OfficialBlumarkLogo` component / brand PNG | **NO** (reused as-is) |
| Existing `LandingPage.tsx`, `HeroVisual.tsx`, `DemoDashboardLanding.tsx` | **NO** (left in place; can still be wired manually) |
| `src/app/page.tsx` | One-line import swap only (allowed — landing-component slot) |
| New dependencies | **NONE** — `lucide-react` + Tailwind only |
| External images / fonts / videos / canvas | **NONE** |

## Validation

```
npx tsc --noEmit   → clean, no output
npm run lint       → only the pre-existing no-page-custom-font
                     warning in src/app/layout.tsx (unrelated)
npm run build      → succeeds, 20/20 routes prerendered
                     /     →  13.5 kB / 302 kB First Load JS
                     /demo →  14.5 kB / 215 kB First Load JS (unchanged)
```

## Safe to merge?

**YES.** Diff is contained to one new component file, one one-line import swap in `src/app/page.tsx`, and this audit doc. `/demo` is untouched (its bundle size is identical to the previous PR's output). Build / typecheck / lint pipeline clean.
