"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getAllProfiles, updateProfileRole, toggleProfileStatus } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export type UserRole =
  | "super_admin"
  | "board_member"
  | "owner"
  | "general_manager"
  | "defense_manager"
  | "attack_manager"
  | "manager"
  | "finance_manager"
  | "sales_manager"
  | "hr_manager"
  | "employee";

export type Permission = string;

export const ALL_ROLES: UserRole[] = [
  "super_admin","board_member","owner","general_manager","defense_manager","attack_manager","manager","finance_manager","sales_manager","hr_manager","employee"
];

export const ALL_PERMISSIONS: Permission[] = [
  "view_dashboard","manage_board","manage_users","manage_roles","manage_tasks","manage_clients","manage_finance","manage_reports","manage_settings","manage_automations",
  "dashboard.view","users.view","users.create","users.update","users.delete","users.manage_roles",
  "employees.view","employees.create","employees.update","employees.delete",
  "tasks.view","tasks.create","tasks.update","tasks.delete","tasks.assign",
  "clients.view","clients.create","clients.update","clients.delete",
  "finance.view","finance.create","finance.update","finance.delete",
  "invoices.view","invoices.create","invoices.update","invoices.delete",
  "expenses.view","expenses.create","expenses.update","expenses.delete",
  "strategy.view","strategy.create","strategy.update","strategy.delete",
  "organization.view","organization.create","organization.update","organization.delete",
  "automation.view","automation.create","automation.update","automation.delete","automation.run",
  "reports.view","reports.create","reports.export","reports.print",
  "settings.view","settings.update","activity_logs.view","profile.view","profile.update"
];

export const PERMISSION_LABELS: Record<string,string> = {};
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [], board_member: [], owner: [], general_manager: [], defense_manager: [],
  attack_manager: [], manager: [], finance_manager: [], sales_manager: [], hr_manager: [], employee: []
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير أعلى",
  chairman: "رئيس مجلس الإدارة",
  board_member: "عضو مجلس الإدارة",
  general_manager: "مدير عام",
  department_manager: "مدير قسم",
  accountant: "محاسب",
  employee: "موظف",
  viewer: "مشاهد",
  admin: "مدير",
  manager: "مدير قسم",
};

export function mapAuthRoleToUserRole(role: string): UserRole {
  const normalizedRole = String(role ?? "").trim();
  if (["super_admin", "admin", "مدير_عام"].includes(normalizedRole)) return "super_admin";
  if (["chairman","board_member"].includes(normalizedRole)) return "board_member";
  if (normalizedRole === "general_manager") return "general_manager";
  if (["department_manager", "manager", "مدير_قسم"].includes(normalizedRole)) return "manager";
  if (["accountant", "finance_manager", "مدير_مالي"].includes(normalizedRole)) return "finance_manager";
  if (normalizedRole === "viewer") return "employee";
  return "employee";
}

export interface ManagedUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  department: string;
}

interface PermissionsContextValue {
  userRole: UserRole;
  permissions: string[];
  hasPermission: (perm: Permission) => boolean;
  managedUsers: ManagedUser[];
  rolePermissions: Record<UserRole, string[]>;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserStatus: (userId: string) => void;
  addManagedUser: (user: Omit<ManagedUser, "userId">) => void;
  updateRolePermissions: (role: UserRole, perms: Permission[]) => void;
  saveAll: () => Promise<void>;
  savePermissions: (perms: Record<UserRole, string[]>) => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  userRole: "employee",
  permissions: [],
  hasPermission: () => false,
  managedUsers: [],
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  updateUserRole: () => {},
  toggleUserStatus: () => {},
  addManagedUser: () => {},
  updateRolePermissions: () => {},
  saveAll: async () => {},
  savePermissions: async () => {},
});

const LEGACY_TO_NEW: Record<string, string[]> = {
  view_dashboard: ["dashboard.view"],
  manage_users: ["users.view", "users.create", "users.update", "users.delete"],
  manage_roles: ["users.manage_roles"],
  manage_tasks: ["tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.assign"],
  manage_clients: ["clients.view", "clients.create", "clients.update", "clients.delete"],
  manage_finance: ["finance.view", "finance.create", "finance.update", "finance.delete"],
  manage_reports: ["reports.view", "reports.create", "reports.export", "reports.print"],
  manage_settings: ["settings.view", "settings.update"],
  manage_automations: ["automation.view", "automation.create", "automation.update", "automation.delete", "automation.run"],
};

const NEW_TO_LEGACY: Record<string, string[]> = Object.entries(LEGACY_TO_NEW).reduce((acc, [legacy, news]) => {
  news.forEach((n) => {
    acc[n] = [...(acc[n] ?? []), legacy];
  });
  return acc;
}, {} as Record<string, string[]>);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, role, permissions: authPermissions, hasPermission: authHasPermission } = useAuth();

  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(DEFAULT_ROLE_PERMISSIONS);
  const [legacyPermsByRole, setLegacyPermsByRole] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!user?.id) return;
    getAllProfiles()
      .then((profiles) => {
        setManagedUsers(
          profiles.map((p) => ({
            userId: p.id,
            email: p.email,
            name: p.name,
            role: mapAuthRoleToUserRole(p.role),
            isActive: p.is_active,
            department: p.department,
          }))
        );
      })
      .catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("role_permissions").select("role, permissions").then(({ data }) => {
      if (!data) return;
      const next: Record<UserRole, string[]> = { ...DEFAULT_ROLE_PERMISSIONS };
      (data as Array<{ role: string; permissions: string[] }>).forEach((r) => {
        if ((ALL_ROLES as string[]).includes(r.role)) next[r.role as UserRole] = r.permissions ?? [];
      });
      setLegacyPermsByRole(next);
      setRolePermissions(next);
    });
  }, [user?.id]);

  const userRole = mapAuthRoleToUserRole(role || user?.role || "employee");

  const hasPermission = useCallback(
    (perm: Permission) => {
      if (authHasPermission(perm)) return true;
      const legacyNeeded = NEW_TO_LEGACY[perm] ?? [perm];
      const currentLegacy = legacyPermsByRole[userRole] ?? [];
      return legacyNeeded.some((p) => currentLegacy.includes(p));
    },
    [authHasPermission, legacyPermsByRole, userRole]
  );

  const updateUserRole = useCallback((userId: string, roleValue: UserRole) => {
    setManagedUsers((prev) => prev.map((u) => (u.userId === userId ? { ...u, role: roleValue } : u)));
    updateProfileRole(userId, roleValue).catch(console.error);
  }, []);

  const toggleUserStatus = useCallback((userId: string) => {
    setManagedUsers((prev) => {
      const next = prev.map((u) => (u.userId === userId ? { ...u, isActive: !u.isActive } : u));
      const target = next.find((u) => u.userId === userId);
      if (target) toggleProfileStatus(userId, target.isActive).catch(console.error);
      return next;
    });
  }, []);

  const addManagedUser = useCallback((u: Omit<ManagedUser, "userId">) => {
    setManagedUsers((prev) => [...prev, { ...u, userId: Date.now().toString() }]);
  }, []);

  const updateRolePermissions = useCallback((roleValue: UserRole, perms: Permission[]) => {
    setRolePermissions((prev) => ({ ...prev, [roleValue]: perms }));
  }, []);

  const saveAll = useCallback(async () => {
    const rows = Object.entries(rolePermissions).map(([r, perms]) => ({ role: r, permissions: perms, updated_at: new Date().toISOString() }));
    if (!rows.length) return;
    const { error } = await supabase.from("role_permissions").upsert(rows, { onConflict: "role" });
    if (error) throw new Error(error.message);
  }, [rolePermissions]);

  const savePermissions = useCallback(async (perms: Record<UserRole, string[]>) => {
    setRolePermissions((prev) => ({ ...prev, ...perms }));
    const rows = Object.entries(perms).map(([r, list]) => ({ role: r, permissions: list, updated_at: new Date().toISOString() }));
    if (!rows.length) return;
    const { error } = await supabase.from("role_permissions").upsert(rows, { onConflict: "role" });
    if (error) throw new Error(error.message);
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        userRole,
        permissions: authPermissions,
        hasPermission,
        managedUsers,
        rolePermissions,
        updateUserRole,
        toggleUserStatus,
        addManagedUser,
        updateRolePermissions,
        saveAll,
        savePermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
