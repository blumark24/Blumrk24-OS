"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BrainCircuit,
  Briefcase,
  ClipboardList,
  Cpu,
  DollarSign,
  FileBarChart,
  Headphones,
  Home,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

// ─── Sidebar nav data ─────────────────────────────────────────────────────────

const SIDE_NAV = [
  { icon: Home, label: "الرئيسية", active: true },
  { icon: Users, label: "الموظفين" },
  { icon: ClipboardList, label: "المهام" },
  { icon: Briefcase, label: "العملاء (CRM)" },
  { icon: DollarSign, label: "المالية" },
  { icon: Target, label: "الاستراتيجية" },
  { icon: BrainCircuit, label: "المساعد الذكي" },
  { icon: FileBarChart, label: "التقارير" },
  { icon: Settings, label: "الإعدادات" },
];

// ─── KPI cards data ───────────────────────────────────────────────────────────

const KPIS = [
  { label: "الموظفون النشطون", value: "156", delta: "+5.3%", icon: Users, accent: "cyan" as const },
  { label: "المهام المكتملة", value: "89%", delta: "+8.7%", icon: ClipboardList, accent: "cyan" as const },
  { label: "إيرادات هذا الشهر", value: "2.45M", delta: "+18.2%", icon: TrendingUp, accent: "warn" as const },
  { label: "إجمالي العملاء", value: "1,248", delta: "+12.5%", icon: Briefcase, accent: "cyan" as const },
];

// ─── Activity feed ────────────────────────────────────────────────────────────

const ACTIVITIES = [
  { icon: UserPlus, label: "تم إضافة عميل جديد", sub: "شركة الانطلاق", time: "منذ 10 دقائق" },
  { icon: FileBarChart, label: "تم اكمال مهمة تصميم هوية بصرية", sub: "", time: "منذ 25 دقيقة" },
  { icon: DollarSign, label: "تم استلام دفعة 50,000 SAR", sub: "", time: "منذ 1 ساعة" },
  { icon: Users, label: "تم إضافة موظف جديد", sub: "سارة أحمد", time: "منذ 2 ساعة" },
  { icon: Workflow, label: "تم تحديث المشروع — تطوير المنصة", sub: "", time: "منذ 3 ساعات" },
];

// ─── Projects table ───────────────────────────────────────────────────────────

const PROJECTS = [
  { name: "تطوير المنصة", client: "شركة التقنية", progress: 75, budget: "250,000 SAR", deadline: "2024-06-15", status: "قيد التنفيذ" },
  { name: "تصميم هوية بصرية", client: "مطعم اللولو", progress: 90, budget: "45,000 SAR", deadline: "2024-05-20", status: "قيد التنفيذ" },
  { name: "حملة تسويقية", client: "مركز الرياض", progress: 60, budget: "80,000 SAR", deadline: "2024-06-01", status: "قيد التنفيذ" },
  { name: "تطبيق الجوال", client: "شركة المستقبل", progress: 30, budget: "150,000 SAR", deadline: "2024-07-10", status: "قيد التنفيذ" },
  { name: "نظام إدارة العملاء", client: "مؤسسة الإبداع", progress: 100, budget: "120,000 SAR", deadline: "2024-05-10", status: "مكتمل" },
];

// ─── Bottom CTA features ──────────────────────────────────────────────────────

const BOTTOM_FEATURES = [
  { icon: Headphones, label: "دعم فني 24/7", sub: "دعم مستمر على مدار الساعة" },
  { icon: Workflow, label: "أتمتة العمليات", sub: "توفير الوقت والجهد" },
  { icon: FileBarChart, label: "تقارير ذكية", sub: "تقارير فورية وشاملة" },
  { icon: Cpu, label: "ذكاء اصطناعي", sub: "مساعد ذكي متقدّم" },
  { icon: ShieldCheck, label: "أمن متقدّم", sub: "حماية بمعايير عالمية" },
];

// ─── Brand panel features ─────────────────────────────────────────────────────

const BRAND_FEATURES = [
  { icon: BrainCircuit, label: "ذكاء اصطناعي متقدّم" },
  { icon: Workflow, label: "أتمتة العمليات" },
  { icon: FileBarChart, label: "تقارير ذكية فورية" },
  { icon: ShieldCheck, label: "أمان وخصوصية عالية" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GlassCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="relative z-30 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.5)]"
            aria-label="إنشاء"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
            aria-label="الوضع"
          >
            <Sun className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
            aria-label="الإشعارات"
          >
            <Bell className="h-4 w-4" strokeWidth={1.6} />
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF7A3D] text-[9px] font-semibold text-white px-1">
              5
            </span>
          </button>
          <button
            type="button"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
            aria-label="الرسائل"
          >
            <Mail className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <div className="inline-flex items-center gap-2 px-1 pe-3 ps-1 rounded-full border border-white/[0.08] bg-white/[0.03]">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] text-[11px] font-semibold text-white">
              أ
            </span>
            <span className="hidden sm:inline text-[12px] text-white/80">أحمد</span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="relative hidden md:block w-[260px] lg:w-[360px]">
            <Search
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 text-white/45"
              strokeWidth={1.6}
            />
            <input
              type="search"
              placeholder="بحث..."
              aria-label="بحث"
              className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md text-[13px] text-white placeholder-white/45 ps-10 pe-3 outline-none focus:border-white/[0.18] transition"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
            aria-label="الإعدادات"
          >
            <Settings className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar (visual right) ───────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside className="relative lg:sticky lg:top-4 self-start">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-center pb-3 border-b border-white/[0.06]">
          <OfficialBlumarkLogo className="w-[140px] sm:w-[150px]" />
        </div>
        <nav className="mt-3 space-y-1">
          {SIDE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition ${
                  item.active
                    ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#3B82F6]/15 to-transparent border border-[rgba(34,211,238,0.24)] text-white shadow-[0_4px_16px_-4px_rgba(34,211,238,0.35)]"
                    : "text-white/72 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`h-4 w-4 ${item.active ? "text-[#22D3EE]" : "text-white/55"}`} strokeWidth={1.6} />
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
              أم
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-white truncate">أحمد محمد</div>
              <div className="text-[11px] text-white/55 truncate">مدير عام</div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
          </div>
        </div>
      </GlassCard>
    </aside>
  );
}

// ─── Center dashboard ─────────────────────────────────────────────────────────

function KpiRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {KPIS.map((k) => {
        const Icon = k.icon;
        const accentBg =
          k.accent === "warn"
            ? "bg-gradient-to-br from-[#FF7A3D] to-[#FFB066]"
            : "bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9]";
        const deltaColor = k.accent === "warn" ? "text-[#FFB066]" : "text-[#22D3EE]";
        return (
          <GlassCard key={k.label} className="p-3.5 sm:p-4 lg:p-5 min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.4)] shrink-0 ${accentBg}`}
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
          </GlassCard>
        );
      })}
    </div>
  );
}

function JellyfishWelcome() {
  return (
    <GlassCard className="relative col-span-2 lg:col-span-1 overflow-hidden min-h-[180px] sm:min-h-[200px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgba(34,211,238,0.25),transparent_60%),radial-gradient(ellipse_at_70%_70%,rgba(59,130,246,0.18),transparent_60%)]"
      />
      <Jellyfish />

      <div className="relative p-5 sm:p-6 text-right h-full flex flex-col justify-center">
        <div className="flex items-center justify-end gap-2 text-[20px] sm:text-[22px] font-bold text-white">
          <span>👋</span>
          <span>
            مرحباً <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">أحمد</span>
          </span>
        </div>
        <div className="mt-1 text-[12px] text-white/65">مدير عام</div>
        <div className="mt-3 text-[12.5px] text-white/80">اليوم هو 17 مايو 2026</div>
        <div className="mt-1 text-[11.5px] text-[#22D3EE]">نحو إنجازات أكبر وأداء أفضل</div>
      </div>
    </GlassCard>
  );
}

function Jellyfish() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 200"
      className="pointer-events-none absolute inset-y-0 right-0 h-full w-[55%] opacity-90"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="jelly-bell" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1E6FD9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jelly-tentacle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <filter id="jelly-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <g filter="url(#jelly-blur)">
        <ellipse cx="135" cy="85" rx="78" ry="55" fill="url(#jelly-bell)" />
        <ellipse cx="80" cy="100" rx="42" ry="32" fill="url(#jelly-bell)" opacity="0.55" />
      </g>
      <g stroke="url(#jelly-tentacle)" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M 95 110 Q 92 140 100 175" />
        <path d="M 115 115 Q 118 150 110 185" />
        <path d="M 135 120 Q 132 160 140 195" />
        <path d="M 155 115 Q 158 150 150 188" />
        <path d="M 175 110 Q 178 145 168 180" />
      </g>
    </svg>
  );
}

function SatisfactionGauge() {
  const value = 95;
  // Half-circle gauge: stroke offset from start angle
  const radius = 60;
  const circumference = Math.PI * radius;
  const filled = (value / 100) * circumference;
  return (
    <GlassCard className="p-5 sm:p-6 flex flex-col items-center text-center">
      <div className="text-[12.5px] text-white/70 mb-3">معدل رضا العملاء</div>
      <div className="relative w-[160px] h-[90px]">
        <svg viewBox="0 0 160 90" className="w-full h-full">
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E6FD9" />
            </linearGradient>
          </defs>
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-[26px] font-bold text-white tabular-nums leading-none">{value}%</span>
          <span className="text-[11px] text-[#22D3EE] mt-0.5">ممتاز</span>
        </div>
      </div>
      <div className="mt-3 text-[11px] text-white/60">
        <span className="text-[#22D3EE] font-medium">+5%</span> من الشهر الماضي
      </div>
    </GlassCard>
  );
}

function ReferralCard() {
  return (
    <GlassCard className="p-5 sm:p-6 flex flex-col items-center text-center">
      <div className="text-[12.5px] text-white/70 mb-2">تتبع الإحالات</div>
      <div className="text-[11px] text-white/55">درجة الإحالات</div>
      <div className="mt-1 text-[34px] sm:text-[36px] font-bold text-white tabular-nums leading-none">
        4.8<span className="text-[18px] text-white/55">/5</span>
      </div>
      <div className="mt-2 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < 4 ? "text-[#22D3EE] fill-[#22D3EE]" : "text-[#22D3EE]"}`}
            strokeWidth={1.6}
            fill={i < 4 ? "#22D3EE" : "none"}
          />
        ))}
      </div>
      <div className="mt-3 text-[11px] text-white/60 flex items-center justify-between gap-4 w-full">
        <span>إجمالي الإحالات</span>
        <span className="text-white font-medium tabular-nums">248</span>
      </div>
    </GlassCard>
  );
}

function SalesChart() {
  // 12 month points, two series
  const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  // values in 0..1 (relative)
  const current = [0.42, 0.48, 0.55, 0.50, 0.62, 0.68, 0.60, 0.72, 0.78, 0.74, 0.85, 0.92];
  const previous = [0.32, 0.38, 0.40, 0.45, 0.50, 0.48, 0.55, 0.58, 0.62, 0.65, 0.70, 0.75];

  const W = 480;
  const H = 160;
  const pad = { top: 12, right: 12, bottom: 22, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (i * innerW) / (current.length - 1);
  const y = (v: number) => pad.top + (1 - v) * innerH;

  const pathFor = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");

  const areaFor = (vals: number[]) =>
    `${pathFor(vals)} L ${x(vals.length - 1)} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`;

  return (
    <GlassCard className="p-4 sm:p-5 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-white">نظرة عامة على المبيعات</div>
        <div className="text-[11px] text-white/55">آخر 12 شهر</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[150px] sm:h-[170px] lg:h-[190px]" role="img" aria-label="مخطط المبيعات">
        <defs>
          <linearGradient id="sales-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sales-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E6FD9" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        {/* y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={pad.left} x2={W - pad.right} y1={pad.top + g * innerH} y2={pad.top + g * innerH} stroke="rgba(255,255,255,0.05)" />
            <text
              x={pad.left - 6}
              y={pad.top + g * innerH + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.45)"
              fontSize="9"
            >
              {g === 0 ? "1M" : g === 0.25 ? "750K" : g === 0.5 ? "500K" : g === 0.75 ? "250K" : "0"}
            </text>
          </g>
        ))}
        {/* previous (dashed) */}
        <path d={pathFor(previous)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
        {/* current area + line */}
        <path d={areaFor(current)} fill="url(#sales-area)" />
        <path d={pathFor(current)} fill="none" stroke="url(#sales-line)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(current.length - 1)} cy={y(current[current.length - 1])} r="3.5" fill="#22D3EE" />
        {/* x labels */}
        {monthsAr.map((m, i) => (
          <text
            key={m}
            x={x(i)}
            y={H - 5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.55)"
            fontSize="9"
          >
            {m}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-3 justify-end text-[10.5px] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-[#22D3EE]" /> 2026
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-white/30" /> 2025
        </span>
      </div>
    </GlassCard>
  );
}

function UsersBarChart() {
  const data = [
    { day: "13 مايو", v: 0.72 },
    { day: "6 مايو", v: 0.55 },
    { day: "29 أبريل", v: 0.95 },
    { day: "22 أبريل", v: 0.62 },
    { day: "15 أبريل", v: 0.40 },
  ];
  const W = 320;
  const H = 160;
  const pad = { top: 12, right: 8, bottom: 22, left: 26 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const barW = innerW / data.length / 1.6;

  return (
    <GlassCard className="p-4 sm:p-5 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-white">المستخدمون النشطون</div>
        <div className="text-[11px] text-white/55">آخر 30 يوم</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[150px] sm:h-[170px] lg:h-[190px]" role="img" aria-label="المستخدمون النشطون">
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#1E6FD9" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <g key={g}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={pad.top + g * innerH}
              y2={pad.top + g * innerH}
              stroke="rgba(255,255,255,0.05)"
            />
            <text
              x={pad.left - 6}
              y={pad.top + g * innerH + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.45)"
              fontSize="9"
            >
              {g === 0 ? "200" : g === 0.5 ? "100" : "0"}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.left + (i + 0.5) * (innerW / data.length);
          const bh = d.v * innerH;
          return (
            <g key={d.day}>
              <rect
                x={cx - barW / 2}
                y={pad.top + innerH - bh}
                width={barW}
                height={bh}
                rx="4"
                fill="url(#bar-grad)"
                opacity="0.95"
              />
              <text x={cx} y={H - 5} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9">
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
    </GlassCard>
  );
}

function ActivityFeed() {
  return (
    <GlassCard className="p-4 sm:p-5 lg:row-span-2 flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-white">النشاطات الأخيرة</div>
        <button type="button" className="text-white/55 hover:text-white/80 transition" aria-label="المزيد">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>
      <ul className="space-y-3 flex-1 min-w-0">
        {ACTIVITIES.map((it, i) => {
          const Icon = it.icon;
          return (
            <li key={i} className="flex items-start gap-3 min-w-0">
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
    </GlassCard>
  );
}

function ProjectsTable() {
  return (
    <GlassCard className="p-4 sm:p-5 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-white">المشاريع النشطة</div>
        <button type="button" className="text-white/55 hover:text-white/80 transition" aria-label="المزيد">
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
            {PROJECTS.map((p) => (
              <tr key={p.name} className="border-t border-white/[0.05]">
                <td className="py-3 text-white font-medium">{p.name}</td>
                <td className="py-3 text-white/75">{p.client}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={`h-full ${
                          p.progress === 100
                            ? "bg-emerald-400"
                            : "bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE]"
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/70 tabular-nums shrink-0">{p.progress}%</span>
                  </div>
                </td>
                <td className="py-3 text-white/70 tabular-nums" dir="ltr">{p.budget}</td>
                <td className="py-3 text-white/70 tabular-nums" dir="ltr">{p.deadline}</td>
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
    </GlassCard>
  );
}

function DashboardCenter() {
  return (
    <section className="flex flex-col gap-3 sm:gap-4 min-w-0">
      <KpiRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <JellyfishWelcome />
        <SatisfactionGauge />
        <ReferralCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 min-w-0 flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <SalesChart />
            <UsersBarChart />
          </div>
          <ProjectsTable />
        </div>
        <ActivityFeed />
      </div>
    </section>
  );
}

// ─── Brand panel (visual left) ────────────────────────────────────────────────

function BrandPanel() {
  return (
    <aside className="relative">
      <GlassCard className="relative overflow-hidden p-5 sm:p-6 lg:p-7 h-full min-h-[520px] flex flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_60%,rgba(34,211,238,0.18),transparent_60%),radial-gradient(ellipse_at_70%_85%,rgba(59,130,246,0.12),transparent_60%)]"
        />
        <Jellyfish />

        <div className="relative text-right">
          <OfficialBlumarkLogo className="w-[150px] sm:w-[170px]" />
          <p
            className="mt-5 text-[19px] sm:text-[20px] lg:text-[22px] font-bold leading-snug text-white"
          >
            نظام إدارة الأعمال{" "}
            <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
              بالذكاء الاصطناعي
            </span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            منصة عربية متكاملة لإدارة الموظفين، المهام، العملاء، المالية، التقارير،
            والأتمتة داخل تجربة واحدة مصمّمة للشركات السعودية.
          </p>

          <ul className="relative mt-5 space-y-2.5">
            {BRAND_FEATURES.map((f) => {
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
            <span className="text-[10.5px] text-white/40" dir="ltr">v1.0</span>
          </div>
        </div>
      </GlassCard>
    </aside>
  );
}

function DeviceMockups() {
  return (
    <div className="relative h-[140px]">
      {/* Tablet */}
      <div className="absolute right-0 bottom-0 w-[160px] h-[110px] rounded-xl border border-white/[0.12] bg-[rgba(10,22,40,0.85)] backdrop-blur-sm overflow-hidden shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] rotate-[-3deg]">
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
          <div className="col-span-2 h-12 rounded bg-white/[0.03] border border-white/[0.06] flex items-end">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-6">
              <path d="M 0 22 L 20 18 L 40 12 L 60 14 L 80 6 L 100 4 L 100 30 L 0 30 Z" fill="rgba(34,211,238,0.25)" />
              <path d="M 0 22 L 20 18 L 40 12 L 60 14 L 80 6 L 100 4" stroke="#22D3EE" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div className="h-12 rounded bg-white/[0.03] border border-white/[0.06] flex items-end gap-0.5 p-1">
            {[3, 8, 5, 10, 6].map((h, i) => (
              <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-[#1E6FD9] to-[#22D3EE]" style={{ height: `${h * 4}px` }} />
            ))}
          </div>
        </div>
      </div>
      {/* Phone */}
      <div className="absolute left-2 bottom-1 w-[60px] h-[120px] rounded-2xl border border-white/[0.12] bg-[rgba(10,22,40,0.92)] backdrop-blur-sm overflow-hidden shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] rotate-[6deg]">
        <div className="px-1.5 py-1 flex items-center justify-center border-b border-white/[0.06]">
          <span className="text-[7px] font-semibold text-white">
            Blumark<span className="text-[#22D3EE]">24</span>
          </span>
        </div>
        <div className="p-1 space-y-1">
          <div className="h-3.5 rounded bg-gradient-to-l from-[#22D3EE]/20 to-transparent border border-white/[0.06]" />
          <div className="h-3.5 rounded bg-white/[0.04] border border-white/[0.06]" />
          <div className="h-3.5 rounded bg-white/[0.04] border border-white/[0.06]" />
          <div className="h-3.5 rounded bg-white/[0.04] border border-white/[0.06]" />
          <div className="h-3.5 rounded bg-white/[0.04] border border-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

// ─── Bottom CTA bar ───────────────────────────────────────────────────────────

function BottomCta() {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_left,rgba(34,211,238,0.10),transparent_55%)]"
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-6 items-center">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 min-w-0">
            {BOTTOM_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.label} className="flex items-start gap-2.5 min-w-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/10 to-[#1E6FD9]/10 text-[#22D3EE] shrink-0">
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-white truncate">{f.label}</div>
                    <div className="text-[10.5px] text-white/55 leading-snug line-clamp-2">{f.sub}</div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-stretch gap-3 lg:gap-2 min-w-[260px]">
            <div className="text-right lg:text-right">
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
              href="/demo"
              className="group inline-flex items-center justify-center gap-2 rounded-xl font-medium h-11 px-5 text-[13.5px] bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition w-full sm:w-auto"
            >
              اطلب عرض تجريبي الآن
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DemoDashboardLanding() {
  return (
    <div
      className="min-h-screen bg-[#050816] text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      {/* Ambient global lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0F172A,#0A1628_45%,#050816)]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 14% 18%, rgba(34,211,238,0.10), transparent 38%), radial-gradient(circle at 86% 28%, rgba(59,130,246,0.08), transparent 40%), radial-gradient(circle at 50% 88%, rgba(30,111,217,0.06), transparent 50%)",
          }}
        />
      </div>

      <TopBar />

      <main className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-5 sm:pb-6">
        <div className="mx-auto max-w-[1440px] grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
          <Sidebar />
          <DashboardCenter />
          <BrandPanel />
        </div>
      </main>

      <BottomCta />
    </div>
  );
}
