import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type PermissionKey = string;

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  department_id?: string | null;
  role?: string | null;
  role_id?: string | null;
  is_active?: boolean | null;
  force_password_change?: boolean | null;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user ?? null;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function refreshSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw new Error(error.message);
  return data.session ?? null;
}

export async function getCurrentProfile(userId: string, email?: string | null): Promise<UserProfile | null> {
  const emailLower = (email ?? "").trim().toLowerCase();
  if (emailLower) {
    const byEmail = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", emailLower)
      .maybeSingle();
    if (!byEmail.error && byEmail.data) return byEmail.data as UserProfile;
  }

  const byId = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (byId.error) throw new Error(byId.error.message);
  return (byId.data as UserProfile | null) ?? null;
}

export async function getUserPermissionKeys(profile: UserProfile): Promise<PermissionKey[]> {
  const roleName = (profile.role ?? "").trim();
  if (roleName === "super_admin") return ["*"];

  // Preferred source: normalized RBAC (roles + role_permissions_map + permissions)
  if (profile.role_id) {
    const { data, error } = await supabase
      .from("role_permissions_map")
      .select("permission:permissions(key)")
      .eq("role_id", profile.role_id);

    if (!error && data) {
      const keys = (data as Array<{ permission?: { key?: string } | null }>)
        .map((row) => row.permission?.key)
        .filter((k): k is string => Boolean(k));
      if (keys.length) return Array.from(new Set(keys));
    }
  }

  // Fallback: legacy role_permissions table (text[])
  if (roleName) {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("role", roleName)
      .maybeSingle();

    if (!error && data?.permissions) {
      return (data.permissions as string[]).map(legacyPermissionToKey);
    }
  }

  return [];
}

function legacyPermissionToKey(value: string): string {
  const map: Record<string, string> = {
    view_dashboard: "dashboard.view",
    manage_users: "users.view",
    manage_roles: "users.manage_roles",
    manage_tasks: "tasks.view",
    manage_clients: "clients.view",
    manage_finance: "finance.view",
    manage_reports: "reports.view",
    manage_settings: "settings.view",
    manage_automations: "automation.view",
  };
  return map[value] ?? value;
}
