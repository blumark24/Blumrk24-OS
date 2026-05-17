import { Star } from "lucide-react";
import { DEMO_REFERRAL, DEMO_SATISFACTION, DEMO_USER } from "@/data/demo-dashboard";
import Jellyfish from "./Jellyfish";

function GlassCard({
  className = "",
  children,
  title,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:bg-[rgba(10,22,40,0.72)] ${className}`}
    >
      {children}
    </div>
  );
}

function ReferralCard() {
  return (
    <GlassCard className="p-5 sm:p-6 flex flex-col items-center text-center min-h-[200px] sm:min-h-[210px]" title="تتبع الإحالات">
      <div className="text-[12.5px] text-white/70 mb-2">تتبع الإحالات</div>
      <div className="text-[11px] text-white/55">درجة الإحالات</div>
      <div className="mt-1 text-[32px] sm:text-[36px] font-bold text-white tabular-nums leading-none">
        {DEMO_REFERRAL.score}
        <span className="text-[18px] text-white/55">/5</span>
      </div>
      <div className="mt-2 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 text-[#22D3EE]"
            strokeWidth={1.6}
            fill={i < Math.floor(DEMO_REFERRAL.score) ? "#22D3EE" : "none"}
          />
        ))}
      </div>
      <div className="mt-auto pt-3 text-[11px] text-white/60 flex items-center justify-between gap-4 w-full">
        <span>إجمالي الإحالات</span>
        <span className="text-white font-medium tabular-nums">{DEMO_REFERRAL.total}</span>
      </div>
    </GlassCard>
  );
}

function SatisfactionGauge() {
  const value = DEMO_SATISFACTION.value;
  const radius = 60;
  const circumference = Math.PI * radius;
  const filled = (value / 100) * circumference;
  return (
    <GlassCard className="p-5 sm:p-6 flex flex-col items-center text-center min-h-[200px] sm:min-h-[210px]" title="معدل رضا العملاء">
      <div className="text-[12.5px] text-white/70 mb-3">معدل رضا العملاء</div>
      <div className="relative w-[160px] h-[88px]">
        <svg viewBox="0 0 160 90" className="w-full h-full">
          <defs>
            <linearGradient id="demo-gauge-grad" x1="0" y1="0" x2="1" y2="0">
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
            stroke="url(#demo-gauge-grad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-[26px] font-bold text-white tabular-nums leading-none">{value}%</span>
          <span className="text-[11px] text-[#22D3EE] mt-0.5">{DEMO_SATISFACTION.label}</span>
        </div>
      </div>
      <div className="mt-auto pt-3 text-[11px] text-white/60">
        <span className="text-[#22D3EE] font-medium">{DEMO_SATISFACTION.deltaLabel}</span> من الشهر الماضي
      </div>
    </GlassCard>
  );
}

function WelcomeCard() {
  return (
    <GlassCard className="relative overflow-hidden p-5 sm:p-6 min-h-[200px] sm:min-h-[210px]" title="بطاقة الترحيب">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgba(34,211,238,0.25),transparent_60%),radial-gradient(ellipse_at_70%_70%,rgba(59,130,246,0.18),transparent_60%)]"
      />
      <Jellyfish
        variant="card"
        className="absolute inset-y-0 right-0 h-full w-[60%] opacity-90"
      />
      <div className="relative h-full flex flex-col justify-center text-right">
        <div className="flex items-center justify-end gap-2 text-[20px] sm:text-[22px] font-bold text-white">
          <span>👋</span>
          <span>
            مرحباً{" "}
            <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">
              {DEMO_USER.greetingFirstName}
            </span>
          </span>
        </div>
        <div className="mt-1 text-[12px] text-white/65">{DEMO_USER.role}</div>
        <div className="mt-3 text-[12.5px] text-white/80">{DEMO_USER.todayLabel}</div>
        <div className="mt-1 text-[11.5px] text-[#22D3EE]">نحو إنجازات أكبر وأداء أفضل</div>
      </div>
    </GlassCard>
  );
}

export default function DemoOverviewRow() {
  // RTL DOM order: first child → visual right.
  // Image (visual left→right): Welcome → Satisfaction → Referral.
  // So DOM order must be: Referral, Satisfaction, Welcome.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr] gap-3 sm:gap-4">
      <ReferralCard />
      <SatisfactionGauge />
      <div className="md:col-span-2 lg:col-span-1">
        <WelcomeCard />
      </div>
    </div>
  );
}
