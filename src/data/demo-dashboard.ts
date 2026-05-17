import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  ClipboardList,
  Cpu,
  DollarSign,
  FileBarChart,
  FileText,
  Headphones,
  Home,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";

export type DemoNavItem = { icon: LucideIcon; label: string; active?: boolean };
export type DemoKpi = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  accent: "cyan" | "warn";
};
export type DemoSalesPoint = { month: string; current: number; previous: number };
export type DemoUsersPoint = { day: string; users: number };
export type DemoActivity = { icon: LucideIcon; label: string; sub?: string; time: string };
export type DemoProject = {
  name: string;
  client: string;
  progress: number;
  budget: string;
  deadline: string;
  status: "قيد التنفيذ" | "مكتمل";
};
export type DemoFeature = { icon: LucideIcon; label: string; sub?: string };

export const DEMO_NAV: DemoNavItem[] = [
  { icon: Home, label: "الرئيسية", active: true },
  { icon: Users, label: "الموظفين" },
  { icon: ClipboardList, label: "المهام" },
  { icon: Briefcase, label: "العملاء (CRM)" },
  { icon: DollarSign, label: "المالية" },
  { icon: Target, label: "الاستراتيجية" },
  { icon: Bot, label: "المساعد الذكي" },
  { icon: FileBarChart, label: "التقارير" },
  { icon: Settings, label: "الإعدادات" },
];

export const DEMO_KPIS: DemoKpi[] = [
  { label: "الموظفون النشطون", value: "156", delta: "+5.3%", icon: Users, accent: "cyan" },
  { label: "المهام المكتملة", value: "89%", delta: "+8.7%", icon: ClipboardList, accent: "cyan" },
  { label: "إيرادات هذا الشهر", value: "2.45M", delta: "+18.2%", icon: TrendingUp, accent: "warn" },
  { label: "إجمالي العملاء", value: "1,248", delta: "+12.5%", icon: Briefcase, accent: "cyan" },
];

export const DEMO_SALES: DemoSalesPoint[] = [
  { month: "يناير", current: 420000, previous: 320000 },
  { month: "فبراير", current: 480000, previous: 380000 },
  { month: "مارس", current: 550000, previous: 410000 },
  { month: "أبريل", current: 500000, previous: 450000 },
  { month: "مايو", current: 620000, previous: 500000 },
  { month: "يونيو", current: 680000, previous: 480000 },
  { month: "يوليو", current: 600000, previous: 550000 },
  { month: "أغسطس", current: 720000, previous: 580000 },
  { month: "سبتمبر", current: 780000, previous: 620000 },
  { month: "أكتوبر", current: 740000, previous: 660000 },
  { month: "نوفمبر", current: 850000, previous: 700000 },
  { month: "ديسمبر", current: 920000, previous: 750000 },
];

export const DEMO_USERS: DemoUsersPoint[] = [
  { day: "13 مايو", users: 145 },
  { day: "6 مايو", users: 110 },
  { day: "29 أبريل", users: 190 },
  { day: "22 أبريل", users: 124 },
  { day: "15 أبريل", users: 80 },
];

export const DEMO_ACTIVITIES: DemoActivity[] = [
  { icon: UserPlus, label: "تم إضافة عميل جديد", sub: "شركة الانطلاق", time: "منذ 10 دقائق" },
  { icon: FileText, label: "تم إكمال مهمة تصميم هوية بصرية", time: "منذ 25 دقيقة" },
  { icon: DollarSign, label: "تم استلام دفعة 50,000 SAR", time: "منذ 1 ساعة" },
  { icon: Users, label: "تم إضافة موظف جديد", sub: "سارة أحمد", time: "منذ 2 ساعة" },
  { icon: Workflow, label: "تم تحديث المشروع — تطوير المنصة", time: "منذ 3 ساعات" },
];

export const DEMO_PROJECTS: DemoProject[] = [
  { name: "تطوير المنصة", client: "شركة التقنية", progress: 75, budget: "250,000 SAR", deadline: "2024-06-15", status: "قيد التنفيذ" },
  { name: "تصميم هوية بصرية", client: "مطعم اللولو", progress: 90, budget: "45,000 SAR", deadline: "2024-05-20", status: "قيد التنفيذ" },
  { name: "حملة تسويقية", client: "مركز الرياض", progress: 60, budget: "80,000 SAR", deadline: "2024-06-01", status: "قيد التنفيذ" },
  { name: "تطبيق الجوال", client: "شركة المستقبل", progress: 30, budget: "150,000 SAR", deadline: "2024-07-10", status: "قيد التنفيذ" },
  { name: "نظام إدارة العملاء", client: "مؤسسة الإبداع", progress: 100, budget: "120,000 SAR", deadline: "2024-05-10", status: "مكتمل" },
];

export const DEMO_BRAND_FEATURES: DemoFeature[] = [
  { icon: Bot, label: "ذكاء اصطناعي متقدّم" },
  { icon: Workflow, label: "أتمتة العمليات" },
  { icon: FileBarChart, label: "تقارير ذكية فورية" },
  { icon: ShieldCheck, label: "أمان وخصوصية عالية" },
];

export const DEMO_BOTTOM_FEATURES: DemoFeature[] = [
  { icon: Headphones, label: "دعم فني 24/7", sub: "دعم مستمر على مدار الساعة" },
  { icon: Workflow, label: "أتمتة العمليات", sub: "توفير الوقت والجهد" },
  { icon: FileBarChart, label: "تقارير ذكية", sub: "تقارير فورية وشاملة" },
  { icon: Cpu, label: "ذكاء اصطناعي", sub: "مساعد ذكي متقدّم" },
  { icon: ShieldCheck, label: "أمن متقدّم", sub: "حماية بمعايير عالمية" },
];

export const DEMO_USER = {
  name: "أحمد محمد",
  role: "مدير عام",
  initials: "أم",
  greetingFirstName: "أحمد",
  todayLabel: "اليوم هو 15 مايو 2024",
};

export const DEMO_SATISFACTION = { value: 95, label: "ممتاز", deltaLabel: "+5%" };

export const DEMO_REFERRAL = { score: 4.8, total: 248 };
