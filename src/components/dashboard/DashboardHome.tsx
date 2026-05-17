"use client";
import { Bell, CheckCircle2, Mail, Menu, Search, Settings, TriangleAlert, Users, XCircle } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

const baseCard = "rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#061832]/95 via-[#071d3d]/90 to-[#041127]/95 backdrop-blur-xl shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_15px_40px_rgba(3,13,30,0.65)]";

export default function DashboardHome() {
  const { metrics: m, loading, error } = useDashboardMetrics();
  const kpis = [
    { title: "المهام المكتملة", value: `${m?.completedTasksRate ?? 0}%`, desc: "نسبة الإنجاز", icon: CheckCircle2, color: "text-emerald-400", line: "from-emerald-400/90 to-emerald-300/20" },
    { title: "العملاء النشطون", value: `${m?.activeClients ?? 0}`, desc: "عميل نشط حالياً", icon: Users, color: "text-cyan-400", line: "from-cyan-400/90 to-cyan-300/20" },
    { title: "المهام المتأخرة", value: `${m?.overdueTasks ?? 0}`, desc: "مهمة تجاوزت الموعد المحدد", icon: TriangleAlert, color: "text-teal-400", line: "from-teal-400/90 to-teal-300/20" },
    { title: "المهام المتبقية", value: `${m?.remainingTasks ?? 0}`, desc: "مهمة لم تكتمل", icon: XCircle, color: "text-orange-400", line: "from-orange-400/90 to-orange-300/20" },
  ];

  return (
    <div dir="rtl" className="min-h-full text-white pb-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        <header className={`${baseCard} p-3 sm:p-4 flex flex-wrap gap-3 items-center justify-between`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-11 w-11 rounded-full bg-orange-500 text-white font-bold grid place-items-center">BI</div>
            <button className="text-white/75"><Settings size={20} /></button>
            <button className="text-white/75"><Mail size={20} /></button>
            <button className="relative text-white/75"><Bell size={20} /><span className="absolute -top-2 -right-2 bg-orange-500 text-[10px] px-1.5 rounded-full">5</span></button>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#1e90ff] to-[#0ea5e9] text-lg font-semibold">+ جديد</button>
            <div className="flex-1 md:w-72 rounded-2xl border border-cyan-400/20 bg-[#061832]/80 px-3 py-3 flex items-center gap-2"><Search size={18} className="text-cyan-300" /><input placeholder="بحث" className="bg-transparent w-full outline-none" /></div>
            <button className="text-white/75"><Menu /></button>
          </div>
        </header>

        {error && <div className="text-orange-300 text-sm">{error}</div>}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpis.map((k) => (
            <article key={k.title} className={`${baseCard} relative overflow-hidden p-5`}>
              <div className="flex justify-between"><span className="text-cyan-300">مباشر ↗</span><div className="rounded-2xl bg-white/5 border border-white/10 p-2"><k.icon className={k.color} /></div></div>
              <div className="mt-5 text-5xl font-semibold">{loading ? "..." : k.value}</div><div className="mt-2 text-2xl">{k.title}</div><div className="text-white/65">{k.desc}</div>
              <div className="mt-5 pt-3 border-t border-white/10 text-white/70">↗ من الشهر</div><div className={`absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r ${k.line}`} />
            </article>
          ))}
        </section>

        <section className={`${baseCard} overflow-hidden p-6 relative`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(34,211,238,0.28),transparent_55%)]" />
          <div className="absolute left-10 top-6 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl jellyfish-hero" />
          <div className="absolute left-24 top-24 w-16 h-16 rounded-full bg-cyan-300/60 jellyfish-dot" />
          <div className="relative z-10 text-right ms-auto max-w-md space-y-2">
            <h2 className="text-5xl font-bold text-cyan-300">مرحباً Blumark24 CEO</h2><p className="text-3xl text-white/80">مدير أعلى</p><p className="text-3xl text-white/80">اليوم هو 16 مايو 2026</p><p className="text-4xl text-cyan-300">نحو إنجازات أكبر وأداء أفضل</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className={`${baseCard} p-5`}><h3 className="text-2xl">معدل رضا العملاء</h3><div className="mt-5 text-center text-6xl">{m?.customerSatisfaction ?? 0}%</div><p className="text-center text-white/70 mt-2">{m?.customerSatisfaction === null ? "لا توجد بيانات بعد" : "مرضي جداً"}</p></article>
          <article className={`${baseCard} p-5`}><h3 className="text-2xl">المهام حسب الحالة</h3><p className="mt-4 text-white/80">مكتملة: {m?.taskStatusBreakdown.completed ?? 0} • قيد التنفيذ: {m?.taskStatusBreakdown.inProgress ?? 0} • معلقة: {m?.taskStatusBreakdown.pending ?? 0} • متأخرة: {m?.taskStatusBreakdown.overdue ?? 0}</p></article>
          <article className={`${baseCard} p-5`}><h3 className="text-2xl">النشاط الأخير</h3><div className="mt-4 space-y-3">{(m?.recentActivities?.length ?? 0) === 0 ? <p className="text-white/70">لا توجد أنشطة حديثة</p> : m?.recentActivities.map((a) => <div key={a.id} className="border-b border-white/10 pb-2"><p>{a.action}</p><p className="text-white/60 text-sm">{new Date(a.created_at).toLocaleString("ar-SA")}</p></div>)}</div></article>
          <article className={`${baseCard} p-5`}><h3 className="text-2xl">المبيعات الشهرية</h3><div className="mt-4 text-5xl font-semibold">{(m?.monthlySales ?? 0).toLocaleString("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 })}</div><svg className="w-full h-28 mt-4" viewBox="0 0 300 80"><path d="M0 65 L40 48 L80 51 L120 34 L160 38 L200 38 L240 26 L280 12 L300 8" fill="none" stroke="#22d3ee" strokeWidth="2" /></svg></article>
        </section>
      </div>
      <style jsx>{`
        .jellyfish-hero { animation: jellyfishFloat 8s ease-in-out infinite, jellyfishGlow 10s ease-in-out infinite; }
        .jellyfish-dot { animation: jellyfishParticles 6s ease-in-out infinite; }
        @keyframes jellyfishFloat {0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.72;}50%{transform:translate3d(0,-14px,0) scale(1.035);opacity:.96;}}
        @keyframes jellyfishGlow {0%,100%{filter:drop-shadow(0 0 18px rgba(34,211,238,.25));}50%{filter:drop-shadow(0 0 38px rgba(34,211,238,.55));}}
        @keyframes jellyfishParticles {0%,100%{transform:translateY(0);opacity:.35;}50%{transform:translateY(-10px);opacity:.9;}}
        @media (prefers-reduced-motion: reduce) { .jellyfish-hero,.jellyfish-dot { animation: none !important; } }
      `}</style>
    </div>
  );
}
