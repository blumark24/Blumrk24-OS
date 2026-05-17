"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import DemoActivityFeed from "./DemoActivityFeed";
import DemoBottomCta from "./DemoBottomCta";
import DemoBrandPanel from "./DemoBrandPanel";
import DemoChartsRow from "./DemoChartsRow";
import DemoKpiRow from "./DemoKpiRow";
import DemoOverviewRow from "./DemoOverviewRow";
import DemoProjectsTable from "./DemoProjectsTable";
import DemoSidebar from "./DemoSidebar";
import DemoTopBar from "./DemoTopBar";

export default function DemoDashboardPage() {
  const [navOpen, setNavOpen] = useState(false);

  const close = () => {
    setNavOpen(false);
    document.body.style.overflow = "";
  };
  const open = () => {
    setNavOpen(true);
    document.body.style.overflow = "hidden";
  };

  return (
    <div
      className="min-h-screen bg-[#050816] text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      {/* Ambient global lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0F172A,#0A1628_45%,#050816)]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 14% 18%, rgba(34,211,238,0.10), transparent 38%), radial-gradient(circle at 86% 28%, rgba(59,130,246,0.08), transparent 40%), radial-gradient(circle at 50% 88%, rgba(30,111,217,0.06), transparent 50%)",
          }}
        />
      </div>

      {/* Mobile / tablet top header (visible <lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-[rgba(5,8,22,0.85)] backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="flex flex-row-reverse items-center justify-between gap-3 px-3 sm:px-5 h-14">
          <OfficialBlumarkLogo className="w-[130px]" />
          <button
            type="button"
            onClick={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-white hover:bg-white/[0.08] transition"
            aria-label="القائمة"
          >
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {/* Mobile / tablet nav drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md" onClick={close} />
        <div className="absolute inset-y-0 right-0 w-[280px] max-w-[85vw] bg-[rgba(10,22,40,0.96)] backdrop-blur-2xl border-s border-white/[0.10] shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.7)] overflow-y-auto">
          <div className="flex flex-row-reverse items-center justify-between p-4 border-b border-white/[0.06]">
            <OfficialBlumarkLogo className="w-[130px]" />
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
          <div className="p-3">
            <DemoSidebar />
          </div>
        </div>
      </div>

      <main className="px-3 sm:px-5 lg:px-7 xl:px-8 pt-3 sm:pt-5 lg:pt-5 pb-5 sm:pb-6">
        <div className="mx-auto max-w-[1600px]">
          {/* Top bar: only visible on lg+ (mobile/tablet use the sticky header above) */}
          <div className="hidden lg:block mb-4 lg:mb-5">
            <DemoTopBar />
          </div>

          {/* Main 3-zone grid: Sidebar (right) | Center (middle) | Brand panel (left)
              In RTL the DOM order maps: first → right, last → left.
              On <lg the grid collapses to a single column so Sidebar is hidden
              (the mobile drawer above replaces it) and the remaining items stack:
              Center → Brand panel. */}
          <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
            {/* First DOM = visual right (lg+ only) */}
            <div className="hidden lg:block">
              <DemoSidebar />
            </div>

            {/* Middle DOM = visual middle on lg+, top of stack on mobile */}
            <section className="flex flex-col gap-3 sm:gap-4 min-w-0">
              <DemoKpiRow />
              <DemoOverviewRow />

              {/* Charts + Activity feed row.
                  Desktop: Activity on the right (first DOM), charts + projects on the left.
                  Mobile (single column): charts + projects first, activity below. */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] gap-3 sm:gap-4 min-w-0">
                <div className="order-2 lg:order-1">
                  <DemoActivityFeed />
                </div>
                <div className="order-1 lg:order-2 flex flex-col gap-3 sm:gap-4 min-w-0">
                  <DemoChartsRow />
                  <DemoProjectsTable />
                </div>
              </div>
            </section>

            {/* Last DOM = visual left on lg+, bottom of stack on mobile */}
            <DemoBrandPanel />
          </div>

          {/* Bottom CTA */}
          <div className="mt-3 sm:mt-4 lg:mt-5">
            <DemoBottomCta />
          </div>
        </div>
      </main>
    </div>
  );
}
