import { MoreHorizontal } from "lucide-react";
import { DEMO_ACTIVITIES } from "@/data/demo-dashboard";

export default function DemoActivityFeed() {
  return (
    <div
      title="النشاطات الأخيرة"
      className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-4 sm:p-5 min-w-0 flex flex-col h-full transition-all duration-300 hover:border-white/[0.16]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] sm:text-[14px] font-semibold text-white">النشاطات الأخيرة</div>
        <button
          type="button"
          className="text-white/55 hover:text-white/80 transition"
          aria-label="المزيد"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>
      <ul className="space-y-3 flex-1 min-w-0">
        {DEMO_ACTIVITIES.map((it, i) => {
          const Icon = it.icon;
          return (
            <li
              key={i}
              className="flex items-start gap-3 min-w-0 rounded-xl p-1.5 -m-1.5 transition hover:bg-white/[0.03]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#22D3EE] shrink-0">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] text-white/90 leading-snug">{it.label}</div>
                {it.sub && <div className="text-[11px] text-white/55 mt-0.5">{it.sub}</div>}
                <div className="text-[10.5px] text-white/45 mt-0.5">{it.time}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[12px] text-white/75 hover:bg-white/[0.06] hover:text-white py-2.5 transition"
      >
        عرض جميع النشاطات
      </button>
    </div>
  );
}
