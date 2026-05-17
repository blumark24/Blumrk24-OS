import { ArrowLeft } from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import { DEMO_NAV, DEMO_USER } from "@/data/demo-dashboard";

export default function DemoSidebar() {
  return (
    <aside className="relative lg:sticky lg:top-4 self-start">
      <div className="rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-center pb-3 border-b border-white/[0.06]">
          <OfficialBlumarkLogo className="w-[140px] sm:w-[150px]" />
        </div>
        <nav className="mt-3 space-y-1">
          {DEMO_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition cursor-default ${
                  item.active
                    ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#3B82F6]/15 to-transparent border border-[rgba(34,211,238,0.24)] text-white shadow-[0_4px_16px_-4px_rgba(34,211,238,0.35)]"
                    : "text-white/72 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 ${item.active ? "text-[#22D3EE]" : "text-white/55"}`}
                    strokeWidth={1.6}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                <ArrowLeft
                  className={`h-3.5 w-3.5 ${item.active ? "text-[#22D3EE]" : "text-white/30"}`}
                  strokeWidth={1.6}
                />
              </div>
            );
          })}
        </nav>

        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] text-[12px] font-semibold text-white shrink-0">
              {DEMO_USER.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-white truncate">
                {DEMO_USER.name}
              </div>
              <div className="text-[11px] text-white/55 truncate">{DEMO_USER.role}</div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
