"use client";

import { usePermissions, Permission } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldOff } from "lucide-react";

interface PageGuardProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function PageGuard({ permission, children }: PageGuardProps) {
  const { hasPermission } = usePermissions();
  const { loading } = useAuth();

  // While auth is resolving show a branded spinner.
  // We must NOT render protected children before the real role is known, and
  // we must NOT show the access-denied screen before we know the user lacks
  // access — both would be wrong (security / UX respectively).
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a1628" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#1e3a5f] border-t-[#22d3ee] animate-spin" />
      </div>
    );
  }

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-heading font-bold">لا تملك صلاحية الوصول</h2>
        <p className="text-[#8ba3c7] text-sm max-w-xs">
          هذا القسم محجوز. تواصل مع المدير الأعلى للحصول على الصلاحية.
        </p>
      </div>
    </DashboardLayout>
  );
}
