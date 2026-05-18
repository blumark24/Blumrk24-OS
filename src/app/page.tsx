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
  CheckCircle,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities, useTransactions, useEmployees, useClients, useTasks } from "@/hooks/useData";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { UserRole } from "@/contexts/PermissionsContext";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = { background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" };

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

  // Super-admin gate for surfacing employee names inside KPI details.
  // Mirrors the existing AuthContext/PermissionsContext logic — uses the
  // resolved role from the live user (not the lazily-updated context state)
  // so the gate decides correctly on the very first render after auth.
  const isSuperAdmin = user
    ? mapAuthRoleToUserRole(user.role) === "super_admin"
    : userRole === "super_admin";

  const currentYear = new Date().getFullYear();

  // Monthly income from real transactions
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

  // Active employees by department
  const activeUsersData = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department))).slice(0, 6);
    return depts.map((dept) => ({
      date: dept,
      users: employees.filter((e) => e.department === dept && e.status === "نشط").length,
    }));
  }, [employees]);

  // Real client satisfaction: active / total ratio as percentage
  const satisfactionPct = useMemo(() => {
    if (!clients.length) return 0;
    const active = clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length;
    return Math.round((active / clients.length) * 100);
  }, [clients]);

  // Role label
  const roleLabel = user?.role
    ? ROLE_LABELS[user.role as UserRole] ?? user.role
    : "—";

  // ─── KPI card detail data ───────────────────────────────────────────
  // All four computed from data already loaded by hooks above — no new
  // queries, no new endpoints, no schema touched.

  // Top active employees — only revealed for super_admin (PII gate).
  const activeEmployeeNames = useMemo(() => {
    if (!isSuperAdmin) return [];
    return employees
      .filter((e) => e.status === "نشط")
      .slice(0, 3)
      .map((e) => e.name);
  }, [employees, isSuperAdmin]);

  // Latest completed task — most recently completed by createdAt (proxy for
  // completion time; the schema doesn't expose completedAt).
  const latestCompletedTask = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "مكتملة");
    if (!completed.length) return null;
    return completed
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  }, [tasks]);

  // Nearest upcoming deadline — non-completed, not yet past due.
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

  // Most-overdue task — explicitly labelled "متأخرة" OR not complete with a
  // due-date in the past.
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

  // Short Arabic date "12 أبريل" — for the deadline detail strip.
  function shortArabicDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
  }

  // Two-letter Arabic initials for stacked-avatar display.
  function initials(name: string): string {
    const trimmed = (name || "").trim();
    if (!trimmed) return "؟";
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  }

  // While auth resolves: render the dashboard chrome with skeletons so
  // the user sees a live shell instead of a blank full-viewport spinner.
  // Once auth resolves: if no user, render the public landing page.
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

  // KPI card definitions — values from Supabase, no fake change percentages
  const kpiCards = [
    {
      label:     "العملاء النشطون",
      value:     kpi.activeClients.toString(),
      subtitle:  "عميل نشط حالياً",
      icon:      Users,
      gradient:  "from-[#1e6fd9] to-[#0d4fa0]",
      iconBg:    "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label:     "المهام المكتملة",
      value:     `${kpi.completedTasksPct}%`,
      subtitle:  "نسبة الإنجاز",
      icon:      CheckCircle2,
      gradient:  "from-[#10b981] to-[#059669]",
      iconBg:    "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      label:     "المهام المتبقية",
      value:     kpi.incompleteTasks.toString(),
      subtitle:  "مهمة لم تُكتمل",
      icon:      XCircle,
      gradient:  "from-[#f59e0b] to-[#d97706]",
      iconBg:    "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
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

        {/* ── KPI Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card, i) => (
                <div key={i} className="glass-card glass-card-hover p-5 relative overflow-hidden flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl ${card.iconBg}`}>
                      <card.icon size={20} className={card.iconColor} />
                    </div>
                    <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-[#22d3ee] select-none cursor-pointer">
                      <ArrowUpRight size={13} />
                      <span className="select-none">مباشر</span>
                    </button>
                  </div>
                  <div className="text-2xl font-heading font-bold text-white mb-1">{card.value}</div>
                  <div className="text-sm text-[#8ba3c7] mb-1">{card.label}</div>
                  <div className="text-xs text-[#6b87ab]">{card.subtitle}</div>

                  {/* ── Detail strip ─────────────────────────────────────
                       Uses already-loaded data only.  Stays small + RTL +
                       same colour palette as the rest of the card. */}
                  <div className="mt-3 pt-3 border-t border-[#1e3a5f]/40 text-[11px] text-[#8ba3c7] min-h-[28px]">
                    {/* 0 — Active Clients: super-admin sees active-employee
                          initials; everyone else sees a compact ratio. */}
                    {i === 0 && (
                      isSuperAdmin && activeEmployeeNames.length > 0 ? (
                        <div className="flex items-center gap-2 min-w-0" title={activeEmployeeNames.join("، ")}>
                          <div className="flex -space-x-1.5 rtl:space-x-reverse flex-shrink-0">
                            {activeEmployeeNames.map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ring-2 ring-[#0a1628]"
                                style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
                              >
                                {initials(name)}
                              </span>
                            ))}
                          </div>
                          <span className="truncate">يدعمون العملاء</span>
                        </div>
                      ) : clients.length > 0 ? (
                        <span>{kpi.activeClients} من {clients.length} عميل</span>
                      ) : (
                        <span>لا توجد بيانات حالياً</span>
                      )
                    )}

                    {/* 1 — Completed Tasks: title of the latest completed task */}
                    {i === 1 && (
                      latestCompletedTask ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{latestCompletedTask.title}</span>
                        </div>
                      ) : (
                        <span>لا توجد بيانات حالياً</span>
                      )
                    )}

                    {/* 2 — Incomplete Tasks: nearest upcoming deadline */}
                    {i === 2 && (
                      nearestDeadlineTask ? (
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock size={11} className="text-amber-400 flex-shrink-0" />
                            <span className="truncate">{nearestDeadlineTask.title}</span>
                          </div>
                          <span className="text-[10px] text-[#6b87ab] flex-shrink-0">{shortArabicDate(nearestDeadlineTask.dueDate)}</span>
                        </div>
                      ) : (
                        <span>لا توجد بيانات حالياً</span>
                      )
                    )}

                    {/* 3 — Overdue Tasks: oldest overdue title or success */}
                    {i === 3 && (
                      mostOverdueTask ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                          <span className="truncate">{mostOverdueTask.title}</span>
                        </div>
                      ) : tasks.length > 0 ? (
                        <span className="text-emerald-400">كل المهام في الموعد</span>
                      ) : (
                        <span>لا توجد بيانات حالياً</span>
                      )
                    )}
                  </div>

                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />
                </div>
              ))}
        </div>

        {/* ── Welcome + Satisfaction + Summary ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Welcome card — real user data */}
          <div className="lg:col-span-1 glass-card relative overflow-hidden p-6 min-h-[180px]">
            <JellyfishBackground />
            <div className="relative z-10">
              <div className="text-2xl mb-2">👋</div>
              <h2 className="text-xl font-heading font-bold text-white mb-1">
                مرحباً {user?.name ?? "..."}
              </h2>
              <p className="text-[#8ba3c7] text-sm mb-1">{roleLabel}</p>
              <p className="text-xs text-[#6b87ab]">اليوم هو {todayArabic()}</p>
              <p className="text-xs text-[#22d3ee] mt-2 font-medium">نحو إنجازات أكبر وأداء أفضل</p>
            </div>
          </div>

          {/* Client Satisfaction — computed from real data */}
          <div className="glass-card p-5 flex flex-col items-center justify-center">
            <h3 className="text-[#8ba3c7] text-sm mb-4">معدل رضا العملاء</h3>
            {kpiLoading ? (
              <div className="w-32 h-32 rounded-full border-8 border-[#1e3a5f] flex items-center justify-center">
                <span className="text-[#8ba3c7] text-xs">جارٍ التحميل...</span>
              </div>
            ) : (
              <>
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1e3a5f" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="url(#satGrad)" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50 * (satisfactionPct / 100)} ${2 * Math.PI * 50 * (1 - satisfactionPct / 100)}`}
                    />
                    <defs>
                      <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-bold text-white">{satisfactionPct}%</span>
                    <span className="text-xs font-medium" style={{ color: satisfactionPct >= 70 ? "#10b981" : satisfactionPct >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#8ba3c7] mt-3 text-center">
                  {clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length} من {clients.length} عميل نشط/متعاقد
                </p>
              </>
            )}
          </div>

          {/* Quick Stats — real numbers */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-sm">ملخص سريع</h3>
              <span className="badge status-active">مباشر</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]">
                <span className="text-xs text-[#8ba3c7]">إجمالي الموظفين</span>
                <span className="text-white font-bold text-sm">{employees.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]">
                <span className="text-xs text-[#8ba3c7]">الموظفون النشطون</span>
                <span className="text-emerald-400 font-bold text-sm">{employees.filter((e) => e.status === "نشط").length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]">
                <span className="text-xs text-[#8ba3c7]">إجمالي العملاء</span>
                <span className="text-[#22d3ee] font-bold text-sm">{clients.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#8ba3c7]">صافي الدخل</span>
                <span className="font-bold text-sm" style={{ color: kpi.netProfit >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatCurrency(kpi.netProfit)} SAR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-medium">نظرة عامة على الإيرادات</h3>
              <span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">آخر 12 شهر</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="month"    tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => v === "current" ? String(currentYear) : String(currentYear - 1)} />
                <Line type="monotone" dataKey="current"  stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" />
                <Line type="monotone" dataKey="previous" stroke="#1e3a5f" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-medium text-sm">الموظفون بالقسم</h3>
              <span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">{employees.filter((e) => e.status === "نشط").length} نشط</span>
            </div>
            {activeUsersData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-[#8ba3c7] text-sm">لا توجد بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activeUsersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                  <XAxis dataKey="date" tick={{ fill: "#8ba3c7", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#8ba3c7" }} />
                  <Bar dataKey="users" fill="#1e6fd9" radius={[4, 4, 0, 0]} name="موظف نشط" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Projects + Activity ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Projects */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">المشاريع النشطة</h3>
              <button className="text-[#22d3ee] text-xs hover:underline">عرض الكل</button>
            </div>
            {projLoad ? (
              <ChartSkeleton height={180} />
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-[#8ba3c7] text-sm">لا توجد مشاريع بعد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      {["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => (
                        <th key={h} className="text-right text-[#8ba3c7] font-medium pb-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                        <td className="py-3"><span className="text-white font-medium">{project.name}</span></td>
                        <td className="py-3 text-[#8ba3c7]">{project.clientName}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="progress-bar w-20">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${project.progress}%`,
                                  background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)",
                                }}
                              />
                            </div>
                            <span className="text-xs text-[#8ba3c7]">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-[#8ba3c7] text-xs">{formatCurrency(project.budget)} SAR</td>
                        <td className="py-3 text-[#8ba3c7] text-xs">{project.deadline}</td>
                        <td className="py-3">
                          <span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>
                            {project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-sm">النشاطات الأخيرة</h3>
            </div>
            {actLoad ? (
              <CardSkeleton rows={5} />
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-[#8ba3c7] text-sm">لا توجد نشاطات بعد</div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-[#1e3a5f]/40 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1a3356] text-[#22d3ee]">
                      {activityIcons[activity.type] ?? <Activity size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug">{activity.description}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-[#6b87ab]">
                        <Clock size={10} />
                        <span>{timeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
