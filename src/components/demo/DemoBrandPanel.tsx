import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import { DEMO_BRAND_FEATURES } from "@/data/demo-dashboard";
import Jellyfish from "./Jellyfish";

function DeviceMockups() {
  return (
    <div className="relative h-[150px] sm:h-[170px]">
      {/* Tablet */}
      <div className="absolute right-2 bottom-0 w-[180px] h-[120px] rounded-xl border border-white/[0.12] bg-[rgba(10,22,40,0.85)] backdrop-blur-sm overflow-hidden shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] rotate-[-3deg]">
        <div className="px-2 py-1.5 flex items-center justify-between border-b border-white/[0.06]">
          <span className="text-[8px] font-semibold text-white">
            Blumark<span className="text-[#22D3EE]">24</span>
          </span>
          <span className="h-1 w-6 rounded-full bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-1 p-1.5">
          <div className="h-7 rounded bg-gradient-to-br from-[#22D3EE]/25 to-[#1E6FD9]/10 border border-white/[0.06]" />
          <div className="h-7 rounded bg-white/[0.04] border border-white/[0.06]" />
          <div className="h-7 rounded bg-white/[0.04] border border-white/[0.06]" />
          <div className="col-span-2 h-14 rounded bg-white/[0.03] border border-white/[0.06] flex items-end">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-7">
              <path
                d="M 0 22 L 20 18 L 40 12 L 60 14 L 80 6 L 100 4 L 100 30 L 0 30 Z"
                fill="rgba(34,211,238,0.28)"
              />
              <path
                d="M 0 22 L 20 18 L 40 12 L 60 14 L 80 6 L 100 4"
                stroke="#22D3EE"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>
          <div className="h-14 rounded bg-white/[0.03] border border-white/[0.06] flex items-end gap-0.5 p-1">
            {[3, 8, 5, 10, 6].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-[#1E6FD9] to-[#22D3EE]"
                style={{ height: `${h * 4}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="absolute left-2 bottom-2 w-[66px] h-[130px] rounded-2xl border border-white/[0.12] bg-[rgba(10,22,40,0.92)] backdrop-blur-sm overflow-hidden shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] rotate-[6deg]">
        <div className="px-1.5 py-1 flex items-center justify-center border-b border-white/[0.06]">
          <span className="text-[7px] font-semibold text-white">
            Blumark<span className="text-[#22D3EE]">24</span>
          </span>
        </div>
        <div className="p-1 space-y-1">
          <div className="h-3.5 rounded bg-gradient-to-l from-[#22D3EE]/20 to-transparent border border-white/[0.06]" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 rounded bg-white/[0.04] border border-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoBrandPanel() {
  return (
    <aside className="relative">
      <div className="relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl overflow-hidden p-5 sm:p-6 lg:p-7 h-full min-h-[560px] flex flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_60%,rgba(34,211,238,0.18),transparent_60%),radial-gradient(ellipse_at_70%_85%,rgba(59,130,246,0.12),transparent_60%)]"
        />
        <Jellyfish
          variant="panel"
          className="absolute inset-y-0 right-0 h-full w-[60%] opacity-90"
        />

        <div className="relative text-right">
          <OfficialBlumarkLogo className="w-[150px] sm:w-[170px]" />
          <p className="mt-5 text-[19px] sm:text-[20px] lg:text-[22px] font-bold leading-snug text-white">
            نظام إدارة الأعمال{" "}
            <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
              بالذكاء الاصطناعي
            </span>
          </p>
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            منصة متكاملة لإدارة جميع عمليات الشركات السعودية بذكاء.
          </p>

          <ul className="relative mt-5 space-y-2.5">
            {DEMO_BRAND_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.label} className="flex items-center gap-2.5 text-[13px] text-white/85">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.10] bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/10 to-[#1E6FD9]/10 text-[#22D3EE]">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </span>
                  <span>{f.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative mt-auto pt-6">
          <DeviceMockups />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11.5px] font-mono text-white/55" dir="ltr">
              Blumark24.com
            </span>
            <span className="text-[10.5px] text-white/40" dir="ltr">
              v1.0
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
