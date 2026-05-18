"use client";

import LandingPage from "@/components/landing/MarketingLanding";
import DashboardLayout from "@/components/layout/DashboardLayout";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle2, ArrowUpRight, XCircle,
  AlertTriangle, Activity, Clock, UserCheck, DollarSign,
  CheckCircle, X,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities, useTransactions, useEmployees, useClients, useTasks } from "@/hooks/useData";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { UserRole } from "@/contexts/PermissionsContext";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = { background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" };
const DISABLE_TEXT_SELECT_STYLE = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as const;

const CustomTooltip = ({
  active, payload, label,
}: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const now = new Date().getFullYear();
  return (
    <div className="glass-card p-3 text-sm border border-[#1e3a5f]">
      <p className="text-[#8ba3c7] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "#22d3ee" : "#8ba3c7" }}>
          {entry.name === "current" ? `${now}: ` : `${now - 1}: `}{formatCurrency(entry.value)} SAR
        </p>
      ))}
    </div>
  );
};

// ─── Status colours ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  "قيد_التنفيذ": "status-pending",
  "مكتمل":       "status-completed",
  "متوقف":       "status-inactive",
};

const activityIcons: Record<string, React.ReactNode> = {
  employee: <Users       size={14} />,
  task:     <CheckCircle2 size={14} />,
  client:   <UserCheck   size={14} />,
  finance:  <DollarSign  size={14} />,
  project:  <Activity    size={14} />,
};

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// Format today's date in Arabic
function todayArabic() {
  const d = new Date();
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}



type BoardKey = "activeClients" | "completedTasks" | "incompleteTasks" | "overdueTasks";
// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading }                      = useAuth();
  const { userRole }                           = usePermissions();
  const { kpi, loading: kpiLoading }           = useDashboardKPI();
  const { data: projects, loading: projLoad }  = useProjects();
  const { data: activities, loading: actLoad } = useActivities();
  const { data: transactions }                 = useTransactions();
  const { data: employees }                    = useEmployees();
  const { data: clients }                      = useClients();
  const { data: tasks }                        = useTasks();

  const isSuperAdmin = user
    ? mapAuthRoleToUserRole(user.role) === "super_admin"
    : userRole === "super_admin";

  const currentYear = new Date().getFullYear();

  const salesData = useMemo(() => {
    const byMonth: Record<number, number> = {};
    transactions
      .filter((t) => t.type === "دخل")
      .forEach((t) => {
        const m = new Date(t.date).getMonth();
        if (!isNaN(m)) byMonth[m] = (byMonth[m] ?? 0) + t.amount;
      });
    return ARABIC_MONTHS.map((month, i) => ({ month, current: byMonth[i] ?? 0, previous: 0 }));
  }, [transactions]);

  const activeUsersData = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department))).slice(0, 6);
    return depts.map((dept) => ({
      date: dept,
      users: employees.filter((e) => e.department === dept && e.status === "نشط").length,
    }));
  }, [employees]);

  const satisfactionPct = useMemo(() => {
    if (!clients.length) return 0;
    const active = clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length;
    return Math.round((active / clients.length) * 100);
  }, [clients]);

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role as UserRole] ?? user.role
    : "—";

  const activeEmployeeNames = useMemo(() => {
    if (!isSuperAdmin) return [];
    return employees
      .filter((e) => e.status === "نشط")
      .slice(0, 3)
      .map((e) => e.name);
  }, [employees, isSuperAdmin]);

  const latestCompletedTask = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "مكتملة");
    if (!completed.length) return null;
    return completed
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  }, [tasks]);

  const nearestDeadlineTask = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = tasks
      .filter((t) => t.status !== "مكتملة" && t.dueDate)
      .filter((t) => {
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d.getTime() >= today.getTime();
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return upcoming[0] ?? null;
  }, [tasks]);

  const mostOverdueTask = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks
      .filter((t) =>
        t.status === "متأخرة" ||
        (t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < today)
      )
      .filter((t) => t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return overdue[0] ?? null;
  }, [tasks]);

  function shortArabicDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
  }

  function initials(name: string): string {
    const trimmed = (name || "").trim();
    if (!trimmed) return "؟";
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  }

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "نشط").length;
  const potentialClients = clients.filter((c) => c.status === "محتمل").length;
  const contractedClients = clients.filter((c) => c.status === "متعاقد").length;
  const pausedClients = clients.filter((c) => c.status === "متوقف").length;
  const latestClient = clients.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0] ?? null;
  const latestFiveClients = clients.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);

  const completedTasks = tasks.filter((t) => t.status === "مكتملة");
  const incompleteTasks = tasks.filter((t) => t.status !== "مكتملة");
  const overdueTasks = tasks.filter((t) => t.status === "متأخرة" || (t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < new Date()));
  const latestFiveCompletedTasks = completedTasks.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);
  const topFiveIncompleteTasks = incompleteTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")).slice(0, 5);
  const topFiveOverdueTasks = overdueTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")).slice(0, 5);

  const [activeBoard, setActiveBoard] = useState<BoardKey | null>(null);

  const dashboardBoards = {
    activeClients: {
      summary: [
        `إجمالي العملاء: ${totalClients}`,
        `العملاء النشطون: ${activeClients}`,
        `العملاء المحتملون: ${potentialClients}`,
        latestClient ? `آخر عميل: ${latestClient.name}` : "آخر عميل: لا يوجد",
      ],
      detailRows: [
        ["إجمالي العملاء", String(totalClients)],
        ["النشطون", String(activeClients)],
        ["المحتملون", String(potentialClients)],
        ["المتعاقدون", String(contractedClients)],
        ["المتوقفون", String(pausedClients)],
      ],
      detailList: latestFiveClients.map((c) => `${c.name} • ${c.status}${c.city ? ` • ${c.city}` : ""}`),
    },
    completedTasks: {
      summary: [
        `نسبة الإنجاز: ${kpi.completedTasksPct}%`,
        latestCompletedTask ? `آخر مهمة مكتملة: ${latestCompletedTask.title}` : "آخر مهمة مكتملة: لا توجد بيانات حالياً",
      ],
      detailRows: [
        ["عدد المهام المكتملة", String(completedTasks.length)],
        ["نسبة الإنجاز", `${kpi.completedTasksPct}%`],
      ],
      detailList: latestFiveCompletedTasks.map((t) => t.title),
    },
    incompleteTasks: {
      summary: [
        `المهام غير المكتملة: ${kpi.incompleteTasks}`,
        nearestDeadlineTask ? `أقرب موعد: ${nearestDeadlineTask.title} (${shortArabicDate(nearestDeadlineTask.dueDate)})` : "أقرب موعد: لا يوجد",
      ],
      detailRows: [
        ["عدد المهام المتبقية", String(kpi.incompleteTasks)],
        ["أقرب deadline", nearestDeadlineTask ? `${nearestDeadlineTask.title} (${shortArabicDate(nearestDeadlineTask.dueDate)})` : "لا يوجد"],
      ],
      detailList: topFiveIncompleteTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortArabicDate(t.dueDate)}` : ""}`),
    },
    overdueTasks: {
      summary: [
        `المهام المتأخرة: ${kpi.overdueTasks}`,
        mostOverdueTask ? `أقدم مهمة متأخرة: ${mostOverdueTask.title}` : "أقدم مهمة متأخرة: لا توجد",
      ],
      detailRows: [
        ["عدد المهام المتأخرة", String(kpi.overdueTasks)],
        ["أقدم مهمة متأخرة", mostOverdueTask ? `${mostOverdueTask.title}${mostOverdueTask.dueDate ? ` (${shortArabicDate(mostOverdueTask.dueDate)})` : ""}` : "لا توجد"],
      ],
      detailList: topFiveOverdueTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortArabicDate(t.dueDate)}` : ""}`),
    },
  } as const;

  if (loading) return (
    <DashboardLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <ChartSkeleton height={220} />
        <ChartSkeleton height={220} />

      </div>
    </DashboardLayout>
  );
  if (!user) return <LandingPage />;

  const kpiCards = [
    {
      key:       "activeClients" as const,
      label:     "العملاء النشطون",
      value:     kpi.activeClients.toString(),
      subtitle:  "عميل نشط حالياً",
      icon:      Users,
      gradient:  "from-[#1e6fd9] to-[#0d4fa0]",
      iconBg:    "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      key:       "completedTasks" as const,
      label:     "المهام المكتملة",
      value:     `${kpi.completedTasksPct}%`,
      subtitle:  "نسبة الإنجاز",
      icon:      CheckCircle2,
      gradient:  "from-[#10b981] to-[#059669]",
      iconBg:    "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      key:       "incompleteTasks" as const,
      label:     "المهام المتبقية",
      value:     kpi.incompleteTasks.toString(),
      subtitle:  "مهمة لم تُكتمل",
      icon:      XCircle,
      gradient:  "from-[#f59e0b] to-[#d97706]",
      iconBg:    "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      key:       "overdueTasks" as const,
      label:     "المهام المتأخرة",
      value:     kpi.overdueTasks.toString(),
      subtitle:  "مهمة تجاوزت الموعد المحدد",
      icon:      AlertTriangle,
      gradient:  kpi.overdueTasks > 0 ? "from-[#ef4444] to-[#dc2626]" : "from-[#10b981] to-[#059669]",
      iconBg:    kpi.overdueTasks > 0 ? "bg-red-500/20" : "bg-emerald-500/20",
      iconColor: kpi.overdueTasks > 0 ? "text-red-400" : "text-emerald-400",
    },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card, i) => (
                <div key={i} className="glass-card glass-card-hover p-5 relative overflow-hidden flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl ${card.iconBg}`}>
                      <card.icon size={20} className={card.iconColor} />
                    </div>
                    <button
                      type="button"
                      draggable={false}
                      aria-label={`عرض تفاصيل ${card.label}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onTouchStart={(event) => event.currentTarget.blur()}
                      onClick={() => setActiveBoard(card.key)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#22d3ee] select-none cursor-pointer touch-manipulation"
                      style={DISABLE_TEXT_SELECT_STYLE}
                    >
                      <ArrowUpRight size={13} style={DISABLE_TEXT_SELECT_STYLE} />
                      <span className="select-none" style={DISABLE_TEXT_SELECT_STYLE}>مباشر</span>
                    </button>
                  </div>
                  <div className="text-2xl font-heading font-bold text-white mb-1">{card.value}</div>
                  <div className="text-sm text-[#8ba3c7] mb-1">{card.label}</div>
                  <div className="text-xs text-[#6b87ab]">{card.subtitle}</div>
                  <div className="mt-3 pt-3 border-t border-[#1e3a5f]/40 text-[11px] text-[#8ba3c7] min-h-[28px]">
                    {dashboardBoards[card.key].summary.map((line) => (<div key={line} className="truncate">{line}</div>))}
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 glass-card relative overflow-hidden p-6 min-h-[180px]">
            <JellyfishBackground />
            <div className="relative z-10"><div className="text-2xl mb-2">👋</div><h2 className="text-xl font-heading font-bold text-white mb-1">مرحباً {user?.name ?? "..."}</h2><p className="text-[#8ba3c7] text-sm mb-1">{roleLabel}</p><p className="text-xs text-[#6b87ab]">اليوم هو {todayArabic()}</p><p className="text-xs text-[#22d3ee] mt-2 font-medium">نحو إنجازات أكبر وأداء أفضل</p></div>
          </div>
          <div className="glass-card p-5 flex flex-col items-center justify-center"><h3 className="text-[#8ba3c7] text-sm mb-4">معدل رضا العملاء</h3>{kpiLoading ? <div className="w-32 h-32 rounded-full border-8 border-[#1e3a5f] flex items-center justify-center"><span className="text-[#8ba3c7] text-xs">جارٍ التحميل...</span></div> : <><div className="relative w-32 h-32"><svg viewBox="0 0 120 120" className="w-full h-full -rotate-90"><circle cx="60" cy="60" r="50" fill="none" stroke="#1e3a5f" strokeWidth="10" /><circle cx="60" cy="60" r="50" fill="none" stroke="url(#satGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * (satisfactionPct / 100)} ${2 * Math.PI * 50 * (1 - satisfactionPct / 100)}`} /><defs><linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-heading font-bold text-white">{satisfactionPct}%</span><span className="text-xs font-medium" style={{ color: satisfactionPct >= 70 ? "#10b981" : satisfactionPct >= 40 ? "#f59e0b" : "#ef4444" }}>{satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}</span></div></div><p className="text-xs text-[#8ba3c7] mt-3 text-center">{clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length} من {clients.length} عميل نشط/متعاقد</p></>}</div>
          <div className="glass-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-medium text-sm">ملخص سريع</h3><span className="badge status-active">مباشر</span></div><div className="space-y-3"><div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]"><span className="text-xs text-[#8ba3c7]">إجمالي الموظفين</span><span className="text-white font-bold text-sm">{employees.length}</span></div><div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]"><span className="text-xs text-[#8ba3c7]">الموظفون النشطون</span><span className="text-emerald-400 font-bold text-sm">{employees.filter((e) => e.status === "نشط").length}</span></div><div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]"><span className="text-xs text-[#8ba3c7]">إجمالي العملاء</span><span className="text-[#22d3ee] font-bold text-sm">{clients.length}</span></div><div className="flex justify-between items-center"><span className="text-xs text-[#8ba3c7]">صافي الدخل</span><span className="font-bold text-sm" style={{ color: kpi.netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(kpi.netProfit)} SAR</span></div></div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5"><div className="flex items-center justify-between mb-5"><h3 className="text-white font-medium">نظرة عامة على الإيرادات</h3><span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">آخر 12 شهر</span></div><ResponsiveContainer width="100%" height={220}><LineChart data={salesData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" /><XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 11 }} /><YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} /><Tooltip content={<CustomTooltip />} /><Legend formatter={(v) => v === "current" ? String(currentYear) : String(currentYear - 1)} /><Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" /><Line type="monotone" dataKey="previous" stroke="#1e3a5f" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" /></LineChart></ResponsiveContainer></div>
          <div className="glass-card p-5"><div className="flex items-center justify-between mb-5"><h3 className="text-white font-medium text-sm">الموظفون بالقسم</h3><span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">{employees.filter((e) => e.status === "نشط").length} نشط</span></div>{activeUsersData.length === 0 ? <div className="flex items-center justify-center h-[220px] text-[#8ba3c7] text-sm">لا توجد بيانات</div> : <ResponsiveContainer width="100%" height={220}><BarChart data={activeUsersData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" /><XAxis dataKey="date" tick={{ fill: "#8ba3c7", fontSize: 10 }} /><YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} /><Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#8ba3c7" }} /><Bar dataKey="users" fill="#1e6fd9" radius={[4, 4, 0, 0]} name="موظف نشط" /></BarChart></ResponsiveContainer>}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-medium">المشاريع النشطة</h3><button className="text-[#22d3ee] text-xs hover:underline">عرض الكل</button></div>{projLoad ? <ChartSkeleton height={180} /> : projects.length === 0 ? <div className="py-8 text-center text-[#8ba3c7] text-sm">لا توجد مشاريع بعد</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[#1e3a5f]">{["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => <th key={h} className="text-right text-[#8ba3c7] font-medium pb-3">{h}</th>)}</tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0"><td className="py-3"><span className="text-white font-medium">{project.name}</span></td><td className="py-3 text-[#8ba3c7]">{project.clientName}</td><td className="py-3"><div className="flex items-center gap-2"><div className="progress-bar w-20"><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)" }} /></div><span className="text-xs text-[#8ba3c7]">{project.progress}%</span></div></td><td className="py-3 text-[#8ba3c7] text-xs">{formatCurrency(project.budget)} SAR</td><td className="py-3 text-[#8ba3c7] text-xs">{project.deadline}</td><td className="py-3"><span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>{project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}</span></td></tr>)}</tbody></table></div>}</div>
          <div className="glass-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-medium text-sm">النشاطات الأخيرة</h3></div>{actLoad ? <CardSkeleton rows={5} /> : activities.length === 0 ? <div className="py-8 text-center text-[#8ba3c7] text-sm">لا توجد نشاطات بعد</div> : <div className="space-y-3">{activities.map((activity) => <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-[#1e3a5f]/40 last:border-0 last:pb-0"><div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1a3356] text-[#22d3ee]">{activityIcons[activity.type] ?? <Activity size={14} />}</div><div className="flex-1 min-w-0"><p className="text-sm text-white leading-snug">{activity.description}</p><div className="flex items-center gap-1 mt-1 text-xs text-[#6b87ab]"><Clock size={10} /><span>{timeAgo(activity.timestamp)}</span></div></div></div>)}</div>}</div>
        </div>
        {activeBoard && (
          <div className="fixed inset-0 z-50 bg-[#040b17]/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4" dir="rtl">
            <div className="w-full lg:max-w-xl rounded-t-2xl lg:rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(18,33,58,.85),rgba(8,20,38,.82))] shadow-2xl backdrop-blur-xl p-5 lg:p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{kpiCards.find((c) => c.key === activeBoard)?.label}</h3>
                <button
                  type="button"
                  onClick={() => setActiveBoard(null)}
                  aria-label="إغلاق"
                  className="w-9 h-9 rounded-xl border border-white/15 text-[#8ba3c7] hover:text-white hover:border-white/30 inline-flex items-center justify-center touch-manipulation"
                  style={DISABLE_TEXT_SELECT_STYLE}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {dashboardBoards[activeBoard].detailRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[#1e3a5f]/40">
                    <span className="text-[#8ba3c7] text-sm">{label}</span>
                    <span className="text-white text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-[#22d3ee] text-sm mb-2">آخر 5 عناصر</h4>
                {dashboardBoards[activeBoard].detailList.length === 0 ? (
                  <p className="text-[#8ba3c7] text-sm">لا توجد بيانات حالياً</p>
                ) : (
                  <ul className="space-y-2">
                    {dashboardBoards[activeBoard].detailList.map((item) => (
                      <li key={item} className="text-sm text-white/90 bg-white/5 border border-white/10 rounded-xl px-3 py-2">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
