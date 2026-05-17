import { DEMO_KPIS } from "@/data/demo-dashboard";

export default function DemoKpiRow() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {DEMO_KPIS.map((k) => {
        const Icon = k.icon;
        const accentBg =
          k.accent === "warn"
            ? "bg-gradient-to-br from-[#FF7A3D] to-[#FFB066]"
            : "bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9]";
        const deltaColor = k.accent === "warn" ? "text-[#FFB066]" : "text-[#22D3EE]";
        return (
          <div
            key={k.label}
            title={k.label}
            className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-3.5 sm:p-4 lg:p-5 min-w-0 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5 hover:bg-[rgba(10,22,40,0.72)] cursor-default"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.12),transparent_55%)]"
            />
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.4)] shrink-0 transition-transform duration-300 group-hover:scale-110 ${accentBg}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1 text-right">
                <div className="text-[11px] sm:text-[11.5px] text-white/60 truncate">{k.label}</div>
                <div className="mt-0.5 text-[18px] sm:text-[20px] lg:text-[22px] font-bold text-white tabular-nums">
                  {k.value}
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <span className="text-white/55">من الشهر الماضي</span>
              <span className={`font-medium tabular-nums ${deltaColor}`}>{k.delta}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
