import { MoreHorizontal } from "lucide-react";
import { DEMO_PROJECTS } from "@/data/demo-dashboard";

export default function DemoProjectsTable() {
  return (
    <div
      title="المشاريع النشطة"
      className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-4 sm:p-5 min-w-0 overflow-hidden transition-all duration-300 hover:border-white/[0.16]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] sm:text-[14px] font-semibold text-white">المشاريع النشطة</div>
        <button
          type="button"
          className="text-white/55 hover:text-white/80 transition"
          aria-label="المزيد"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[640px] text-[12px]">
          <thead>
            <tr className="text-right text-white/55">
              <th className="font-medium pb-2.5">المشروع</th>
              <th className="font-medium pb-2.5">العميل</th>
              <th className="font-medium pb-2.5">التقدم</th>
              <th className="font-medium pb-2.5">الميزانية</th>
              <th className="font-medium pb-2.5">الموعد النهائي</th>
              <th className="font-medium pb-2.5">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PROJECTS.map((p) => (
              <tr
                key={p.name}
                className="border-t border-white/[0.05] transition hover:bg-white/[0.02]"
              >
                <td className="py-3 text-white font-medium">{p.name}</td>
                <td className="py-3 text-white/75">{p.client}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          p.progress === 100
                            ? "bg-emerald-400"
                            : "bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE]"
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/70 tabular-nums shrink-0">
                      {p.progress}%
                    </span>
                  </div>
                </td>
                <td className="py-3 text-white/70 tabular-nums" dir="ltr">
                  {p.budget}
                </td>
                <td className="py-3 text-white/70 tabular-nums" dir="ltr">
                  {p.deadline}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] ${
                      p.status === "مكتمل"
                        ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                        : "bg-[rgba(34,211,238,0.10)] text-[#22D3EE] border border-[rgba(34,211,238,0.24)]"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
