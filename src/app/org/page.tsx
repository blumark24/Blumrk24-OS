"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Network, Shield, Swords, Users, ChevronDown } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const BOARD_MEMBERS = [
  { name: "عبدالله الشهري", role: "رئيس مجلس الإدارة" },
  { name: "محمد الغامدي", role: "نائب الرئيس" },
  { name: "سلطان العمري", role: "عضو مجلس الإدارة" },
];

const DEFENSE_DEPTS = [
  { name: "الإدارة", icon: "🏢", desc: "إدارة الشؤون الداخلية" },
  { name: "العمليات", icon: "⚙️", desc: "تشغيل وإدارة الأنظمة" },
  { name: "المالي", icon: "💰", desc: "الحسابات والخزينة" },
  { name: "الإبداع", icon: "✨", desc: "الأفكار والمحتوى" },
  { name: "التصميم", icon: "🎨", desc: "الهوية البصرية" },
  { name: "الحملات", icon: "📣", desc: "التسويق الداخلي" },
  { name: "AI Lab", icon: "🤖", desc: "أبحاث الذكاء الاصطناعي" },
];

const OFFENSE_DEPTS = [
  { name: "العملاء CRM", icon: "👥", desc: "إدارة علاقات العملاء" },
  { name: "المبيعات", icon: "📈", desc: "تنمية الإيرادات" },
  { name: "الشراكات", icon: "🤝", desc: "التوسع والتحالفات" },
  { name: "خدمة العملاء", icon: "🎧", desc: "دعم ومتابعة العملاء" },
  { name: "المتابعة", icon: "📋", desc: "تتبع الطلبات والعقود" },
  { name: "العلاقات التجارية", icon: "💼", desc: "بناء شبكة الأعمال" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function BoardCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border border-[#22d3ee]/30 bg-[#22d3ee]/10 text-center min-w-[130px]">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
      >
        {name.slice(0, 2)}
      </div>
      <div>
        <div className="text-white text-sm font-medium leading-tight">{name}</div>
        <div className="text-[#22d3ee] text-[11px] mt-0.5">{role}</div>
      </div>
    </div>
  );
}

function DeptCard({
  name,
  icon,
  desc,
  accentColor,
}: {
  name: string;
  icon: string;
  desc: string;
  accentColor: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all hover:-translate-y-0.5"
      style={{
        background: `${accentColor}10`,
        borderColor: `${accentColor}30`,
      }}
    >
      <span className="text-xl">{icon}</span>
      <div className="text-white text-xs font-medium">{name}</div>
      <div className="text-[10px] leading-tight" style={{ color: `${accentColor}99` }}>
        {desc}
      </div>
    </div>
  );
}

function AgencyBlock({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  depts,
  description,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  depts: typeof DEFENSE_DEPTS;
  description: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl border p-5 flex flex-col gap-4"
      style={{
        background: `${accentColor}08`,
        borderColor: `${accentColor}25`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Agency header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}99)` }}
        >
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-heading font-bold text-base">{title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: `${accentColor}` }}>{subtitle}</div>
        </div>
      </div>

      <p className="text-xs text-[#8ba3c7] leading-relaxed border-t border-[#1e3a5f]/60 pt-3">
        {description}
      </p>

      {/* Connector arrow */}
      <div className="flex justify-center">
        <div
          className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <Users size={11} />
          <span>الأقسام التابعة ({depts.length})</span>
        </div>
      </div>

      {/* Departments grid */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
        {depts.map((dept) => (
          <DeptCard key={dept.name} {...dept} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrgPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
            <Network size={24} className="text-[#22d3ee]" />
            الهيكل الإداري
          </h1>
          <p className="text-[#8ba3c7] text-sm mt-1">
            المخطط التنظيمي لشركة Blumark24
          </p>
        </div>

        {/* ─── Level 1: Board ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          {/* Board box */}
          <div
            className="w-full rounded-2xl border p-5"
            style={{
              background: "rgba(34,211,238,0.07)",
              borderColor: "rgba(34,211,238,0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#22d3ee,#1e6fd9)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-white font-heading font-bold text-lg">مجلس الإدارة</div>
                <div className="text-[#22d3ee] text-xs">Board of Directors</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {BOARD_MEMBERS.map((m) => (
                <BoardCard key={m.name} {...m} />
              ))}
            </div>
          </div>

          {/* Connector line + arrow */}
          <div className="flex flex-col items-center gap-0">
            <div className="w-0.5 h-6 bg-gradient-to-b from-[#22d3ee] to-[#1e6fd9]" />
            <ChevronDown size={16} className="text-[#22d3ee]" />
          </div>

          {/* Branch label */}
          <div className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-3 py-1 rounded-full border border-[#1e3a5f]">
            وكالتان رئيسيتان
          </div>

          {/* Horizontal branch */}
          <div className="relative w-full flex justify-center">
            <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#1e6fd9] via-[#22d3ee]/40 to-[#ff7a3d]" />
            <div className="flex justify-between w-1/2 pt-0">
              <ChevronDown size={16} className="text-[#1e6fd9]" />
              <ChevronDown size={16} className="text-[#ff7a3d]" />
            </div>
          </div>
        </div>

        {/* ─── Level 2: Two agencies ──────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5">
          <AgencyBlock
            title="وكالة الدفاع"
            subtitle="شؤون الشركة الداخلية"
            icon={Shield}
            accentColor="#1e6fd9"
            depts={DEFENSE_DEPTS}
            description="مسؤولة عن شؤون الشركة الداخلية، إدارة ماركتين الشركة، التسويق الداخلي وإدارة العلامة التجارية، وجميع الأقسام التشغيلية والإبداعية."
          />

          <AgencyBlock
            title="وكالة الهجوم"
            subtitle="شؤون الشركة الخارجية"
            icon={Swords}
            accentColor="#ff7a3d"
            depts={OFFENSE_DEPTS}
            description="مسؤولة عن شؤون الشركة الخارجية، اكتساب العملاء والمبيعات والتوسع، وإدارة جميع العلاقات التجارية والشراكات الاستراتيجية."
          />
        </div>

        {/* Legend */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#8ba3c7]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22d3ee]" />
              <span>مجلس الإدارة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1e6fd9]" />
              <span>وكالة الدفاع (داخلي)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff7a3d]" />
              <span>وكالة الهجوم (خارجي)</span>
            </div>
            <div className="mr-auto text-[11px]">
              إجمالي الأقسام: {DEFENSE_DEPTS.length + OFFENSE_DEPTS.length} قسم
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
