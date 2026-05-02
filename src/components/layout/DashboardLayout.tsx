"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header  from "./Header";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { userRole } = usePermissions();

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0a1628" }}>
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

        {/* Debug banner — visible only in dev */}
        {isDev && user && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-1.5 text-xs font-mono flex items-center gap-4 flex-wrap">
            <span className="text-yellow-400 font-bold">[DEBUG]</span>
            <span className="text-yellow-200">email: <b>{user.email}</b></span>
            <span className="text-yellow-200">role: <b>{user.role}</b></span>
            <span className={userRole === "super_admin" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              mapped: {userRole} {userRole === "super_admin" ? "✓ FULL ACCESS" : "✗ LIMITED"}
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
