import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DEMO_BOTTOM_FEATURES } from "@/data/demo-dashboard";

export default function DemoBottomCta() {
  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-4 sm:p-5 lg:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_left,rgba(34,211,238,0.10),transparent_55%)]"
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-6 items-center">
          {/* First DOM = visual right in RTL */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-start gap-3 lg:gap-2 min-w-[260px] order-1 lg:order-2 text-right">
            <div className="flex-1">
              <div className="text-[13px] sm:text-[14px] font-semibold text-white">
                ابدأ رحلتك مع{" "}
                <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">
                  Blumark24 OS
                </span>
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">
                نظام متكامل لإدارة أعمالك بذكاء
              </div>
            </div>
            <Link
              href="/auth"
              className="group inline-flex items-center justify-center gap-2 rounded-xl font-medium h-11 px-5 text-[13.5px] bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition w-full sm:w-auto"
            >
              اطلب عرض تجريبي الآن
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                strokeWidth={1.8}
              />
            </Link>
          </div>

          {/* Last DOM = visual left in RTL: features list */}
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 min-w-0 order-2 lg:order-1">
            {DEMO_BOTTOM_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li
                  key={f.label}
                  className="flex items-start gap-2.5 min-w-0 rounded-xl p-1.5 -m-1.5 transition hover:bg-white/[0.03] cursor-default"
                  title={f.label}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/10 to-[#1E6FD9]/10 text-[#22D3EE] shrink-0">
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-white truncate">
                      {f.label}
                    </div>
                    {f.sub && (
                      <div className="text-[10.5px] text-white/55 leading-snug line-clamp-2">
                        {f.sub}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
