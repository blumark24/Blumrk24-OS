"use client";

// ─── Fully isolated demo dashboard ────────────────────────────────────────────
// • Zero Supabase calls — all data is static seed
// • No auth dependency — any visitor can open /demo
// • Visually identical to the production dashboard (same CSS classes)
// • All write operations disabled with clear Arabic labels
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  Users, CheckCircle2, DollarSign, AlertTriangle,
  BarChart3, Star, TrendingUp, Activity,
} from "lucide-react";

// ─── Seed data ────────────────────────────────────────────────────────────────

const DEMO_KPI = [
  { label: "العملاء النشطون",  value: "12 عميل",         color: "#22d3ee",  icon: Users       },
  { label: "نسبة إتمام المهام", value: "78%",             color: "#10b981",  icon: CheckCircle2 },
  { label: "المهام المتأخرة",  value: "3 مهام",          color: "#f59e0b",  icon: AlertTriangle},
  { label: "صافي الربح",       value: "85,000 SAR",       color: "#a855f7",  icon: DollarSign  },
];

const DEMO_EMPLOYEES = [
  { name: "سارة العتيبي",   dept: "الإدارة",      role: "مدير أعلى",         perf: 5, status: "نشط"    },
  { name: "خالد المطيري",   dept: "وكالة الهجوم", role: "مدير وكالة الهجوم", perf: 4, status: "نشط"    },
  { name: "نورة السبيعي",   dept: "المالية",      role: "مدير مالي",         perf: 4, status: "نشط"    },
  { name: "عبدالله القحطاني", dept: "التصميم",     role: "موظف",              perf: 3, status: "نشط"    },
  { name: "ريم الشمري",      dept: "الإبداع",      role: "موظف",              perf: 4, status: "نشط"    },
];

const DEMO_CLIENTS = [
  { name: "شركة النخبة للتجارة",     type: "تجارة إلكترونية", status: "نشط",    value: "12,000" },
  { name: "مجموعة الأفق للاستثمار", type: "استثمار",          status: "متعاقد", value: "28,000" },
  { name: "مطاعم الذوق الرفيع",      type: "مطاعم وضيافة",    status: "نشط",    value: "8,500"  },
  { name: "أكاديمية المستقبل",        type: "تعليم وتدريب",    status: "محتمل",  value: "—"      },
];

const DEMO_TASKS = [
  { title: "تصميم هوية بصرية جديدة",       status: "قيد_التنفيذ", priority: "عالية",   assignee: "عبدالله" },
  { title: "إطلاق حملة سوشيال ميديا",      status: "مكتملة",     priority: "متوسطة",  assignee: "ريم"    },
  { title: "تقرير الأداء الشهري",           status: "قيد_التنفيذ", priority: "عالية",   assignee: "نورة"   },
  { title: "متابعة عميل مجموعة الأفق",      status: "متأخرة",     priority: "عالية",   assignee: "خالد"   },
  { title: "تحديث استراتيجية المحتوى",      status: "قيد_التنفيذ", priority: "منخفضة",  assignee: "ريم"    },
];

const DEMO_ACTIVITIES = [
  { icon: "👥", text: "تمت إضافة موظف جديد: ريم الشمري",           time: "منذ 5 دقائق"  },
  { icon: "✅", text: "تم إغلاق مهمة: إطلاق حملة سوشيال ميديا",     time: "منذ 2 ساعات"  },
  { icon: "💰", text: "فاتورة جديدة: شركة النخبة (12,000 SAR)",      time: "منذ 4 ساعات"  },
  { icon: "🤝", text: "عميل جديد: مطاعم الذوق الرفيع",               time: "أمس"          },
  { icon: "⚠️", text: "مهمة متأخرة: متابعة عميل مجموعة الأفق",      time: "منذ يومين"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadge = (s: string) =>
  s === "مكتملة"      ? "status-active"   :
  s === "قيد_التنفيذ" ? "status-pending"  :
  s === "متأخرة"      ? "status-inactive" :
  s === "نشط"         ? "status-active"   :
  s === "متعاقد"      ? "status-active"   : "status-pending";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={11} className={i <= n ? "text-amber-400 fill-amber-400" : "text-[#1e3a5f]"} />
      ))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "clients" | "tasks">("overview");

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#0a1628", fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', system-ui, sans-serif", direction: "rtl" }}
    >
      {/* Demo mode banner — sticky top */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 text-sm font-medium"
        style={{ background: "rgba(34,211,238,0.12)", borderBottom: "1px solid rgba(34,211,238,0.3)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
          <span className="text-[#22d3ee]">وضع تجريبي — بيانات للعرض فقط، لا يوجد اتصال بقاعدة البيانات</span>
        </div>
        <a
          href="/auth"
          className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
          style={{ background: "rgba(34,211,238,0.2)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}
        >
          تسجيل الدخول
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            Blumark24 OS — نظام إدارة الأعمال
          </h1>
          <p className="text-[#8ba3c7] text-sm mt-1">لوحة التحكم التجريبية · {new Date().toLocaleDateString("ar-SA")}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {DEMO_KPI.map((k) => (
            <div key={k.label} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${k.color}20` }}>
                  <k.icon size={16} style={{ color: k.color }} />
                </div>
                <span className="text-xs text-[#8ba3c7] leading-tight">{k.label}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#1e3a5f] pb-0">
          {([
            { id: "overview",  label: "نظرة عامة"  },
            { id: "employees", label: "الموظفون"   },
            { id: "clients",   label: "العملاء"    },
            { id: "tasks",     label: "المهام"     },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === t.id
                  ? "border-[#22d3ee] text-[#22d3ee]"
                  : "border-transparent text-[#8ba3c7] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stats bars */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-[#22d3ee]" />
                <h3 className="text-white font-medium text-sm">الأداء الشهري</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "يناير",  pct: 40, val: "34,000 SAR" },
                  { label: "فبراير", pct: 65, val: "55,000 SAR" },
                  { label: "مارس",   pct: 80, val: "68,000 SAR" },
                  { label: "أبريل",  pct: 55, val: "47,000 SAR" },
                  { label: "مايو",   pct: 90, val: "76,500 SAR" },
                  { label: "يونيو",  pct: 75, val: "63,750 SAR" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs text-[#8ba3c7] mb-1">
                      <span>{row.label}</span><span>{row.val}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1e3a5f]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-l from-[#22d3ee] to-[#1e6fd9] transition-all"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-[#22d3ee]" />
                <h3 className="text-white font-medium text-sm">آخر الأنشطة</h3>
              </div>
              <div className="space-y-3">
                {DEMO_ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#1e3a5f]/40 last:border-0">
                    <span className="text-base leading-none mt-0.5">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug">{a.text}</p>
                      <p className="text-xs text-[#6b87ab] mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department breakdown */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[#22d3ee]" />
                <h3 className="text-white font-medium text-sm">توزيع الموظفين بالأقسام</h3>
              </div>
              <div className="space-y-2">
                {[
                  { dept: "وكالة الهجوم", count: 2, color: "#ef4444" },
                  { dept: "الإدارة",      count: 1, color: "#22d3ee" },
                  { dept: "المالية",      count: 1, color: "#ff7a3d" },
                  { dept: "التصميم",      count: 1, color: "#10b981" },
                  { dept: "الإبداع",      count: 1, color: "#a855f7" },
                ].map((d) => (
                  <div key={d.dept} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-[#8ba3c7] text-right">{d.dept}</div>
                    <div className="flex-1 h-5 rounded-lg bg-[#1e3a5f] overflow-hidden">
                      <div
                        className="h-5 rounded-lg flex items-center justify-end pr-2 text-xs text-white font-medium"
                        style={{ width: `${(d.count / 6) * 100}%`, background: d.color }}
                      >
                        {d.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div className="glass-card p-5 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,211,238,0.1)" }}>
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">هذا وضع تجريبي</p>
                <p className="text-[#8ba3c7] text-xs mt-1 max-w-[200px] leading-relaxed">
                  جميع البيانات المعروضة توضيحية. لا يمكن إجراء أي تعديل في هذا الوضع.
                </p>
              </div>
              <a
                href="/auth"
                className="btn-primary text-sm px-4 py-2"
              >
                تسجيل الدخول للإدارة الكاملة
              </a>
            </div>
          </div>
        )}

        {/* Employees tab */}
        {activeTab === "employees" && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">فريق العمل ({DEMO_EMPLOYEES.length} موظفين)</h3>
              <button
                disabled
                className="btn-primary text-sm opacity-40 cursor-not-allowed"
                title="غير متاح في الوضع التجريبي"
              >
                + إضافة موظف (تجريبي)
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["الموظف","القسم","الدور","التقييم","الحالة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_EMPLOYEES.map((e) => (
                  <tr key={e.name} className="border-b border-[#1e3a5f]/40 last:border-0 hover:bg-[#1a3356]/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#22d3ee,#0a1628)" }}
                        >
                          {e.name.slice(0, 2)}
                        </div>
                        <span className="text-white">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{e.dept}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{e.role}</td>
                    <td className="px-4 py-3"><Stars n={e.perf} /></td>
                    <td className="px-4 py-3"><span className={`badge ${statusBadge(e.status)}`}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clients tab */}
        {activeTab === "clients" && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">العملاء ({DEMO_CLIENTS.length} عملاء)</h3>
              <button
                disabled
                className="btn-primary text-sm opacity-40 cursor-not-allowed"
                title="غير متاح في الوضع التجريبي"
              >
                + عميل جديد (تجريبي)
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["العميل","نوع الأعمال","قيمة الخدمة","الحالة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CLIENTS.map((c) => (
                  <tr key={c.name} className="border-b border-[#1e3a5f]/40 last:border-0 hover:bg-[#1a3356]/20">
                    <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{c.type}</td>
                    <td className="px-4 py-3 text-[#22d3ee] font-medium">{c.value} SAR</td>
                    <td className="px-4 py-3"><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === "tasks" && (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1e3a5f]">
              <h3 className="text-white font-medium">المهام ({DEMO_TASKS.length} مهام)</h3>
              <button
                disabled
                className="btn-primary text-sm opacity-40 cursor-not-allowed"
                title="غير متاح في الوضع التجريبي"
              >
                + مهمة جديدة (تجريبي)
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  {["المهمة","المسؤول","الأولوية","الحالة"].map((h) => (
                    <th key={h} className="text-right text-[#8ba3c7] font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_TASKS.map((t) => (
                  <tr key={t.title} className="border-b border-[#1e3a5f]/40 last:border-0 hover:bg-[#1a3356]/20">
                    <td className="px-4 py-3 text-white">{t.title}</td>
                    <td className="px-4 py-3 text-[#8ba3c7]">{t.assignee}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${t.priority === "عالية" ? "status-inactive" : t.priority === "متوسطة" ? "status-pending" : "status-active"}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
