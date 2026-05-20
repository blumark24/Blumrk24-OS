"use client";

import { usePermissions, Permission, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldOff } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface PageGuardProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function PageGuard({ permission, children }: PageGuardProps) {
  const { rolePermissions } = usePermissions();
  const { loading, user } = useAuth();

  // Render the dashboard chrome with a skeleton whenever we don't yet have a
  // resolved user — initial auth resolution, a redirect to /auth in progress,
  // or a profile-load error (whose recoverable banner + retry lives in
  // DashboardLayout).  We must NEVER render protected children before the real
  // role is known, and never show access-denied before we know access is lacked.
  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={4} />
        </div>
      </DashboardLayout>
    );
  }

  // Derive role directly from AuthContext.user (the single source of truth)
  // rather than PermissionsContext state, which updates one render later.
  const resolvedRole = mapAuthRoleToUserRole(user.role);
  const hasPerm =
    resolvedRole === "super_admin" ||
    (rolePermissions[resolvedRole] ?? []).includes(permission);

  if (hasPerm) {
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
