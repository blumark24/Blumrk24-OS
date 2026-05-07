import { supabase } from "./supabase";

// ─── Secure admin helpers ──────────────────────────────────────────────────────
// Tries the Supabase Edge Function first (12 s hard timeout).
// If the Edge Function returns 501 or a placeholder body, automatically falls
// back to the Next.js /api/admin/* routes deployed on Vercel — so employee
// creation works even when the Edge Function hasn't been deployed yet.

const ACTION_ROUTE: Record<string, { path: string; method: string }> = {
  create: { path: "/api/admin/create-user", method: "POST"   },
  delete: { path: "/api/admin/delete-user", method: "DELETE" },
  update: { path: "/api/admin/update-user", method: "PATCH"  },
};

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`الطلب استغرق أكثر من ${timeoutMs / 1000} ثانية — يرجى المحاولة لاحقاً`);
    }
    throw err;
  } finally {
    clearTimeout(tid);
  }
}

function isPlaceholder(data: Record<string, unknown>): boolean {
  const msg = String(data?.message ?? data?.error ?? "").toLowerCase();
  return msg.includes("placeholder") || msg.includes("claude code must deploy");
}

async function adminInvoke(action: string, payload: Record<string, unknown>) {
  // 1. Obtain the current JWT (fast — reads from in-memory cache)
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("لم يتم تسجيل الدخول — يرجى تحديث الصفحة وإعادة المحاولة");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL غير مضبوط في بيئة Next.js");
  }

  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };
  const body = JSON.stringify({ action, ...payload });

  // 2. Try Edge Function with 12-second hard timeout
  let useApiRoute = false;
  try {
    const res = await fetchWithTimeout(
      `${supabaseUrl}/functions/v1/admin-users`,
      { method: "POST", headers, body },
      12_000,
    );

    let data: Record<string, unknown> = {};
    try { data = await res.json(); } catch { /* ignore parse failure */ }

    // Fall back if Edge Function is a placeholder (501 or placeholder body)
    if (res.status === 501 || isPlaceholder(data)) {
      useApiRoute = true;
    } else if (!res.ok) {
      const errMsg = (data?.error as string) ?? `خطأ HTTP ${res.status}`;
      if (errMsg.includes("SERVICE_ROLE_KEY") || errMsg.includes("غير مضبوط")) {
        throw new Error("مفتاح الخدمة غير مضبوط في Supabase Edge Function");
      }
      throw new Error(`تعذر حفظ الموظف: ${errMsg}`);
    } else if (data?.error) {
      throw new Error(`تعذر حفظ الموظف: ${data.error as string}`);
    } else {
      return data;
    }
  } catch (err) {
    // Network errors or timeout from Edge Function → try Next.js route
    if (err instanceof Error && (
      err.message.includes("placeholder") ||
      err.message.includes("استغرق") ||
      err.message.includes("تعذر الاتصال")
    )) {
      useApiRoute = true;
    } else {
      throw err;
    }
  }

  // 3. Fallback: Next.js API route (deployed on Vercel, uses service role key)
  if (useApiRoute) {
    const route = ACTION_ROUTE[action];
    if (!route) throw new Error(`action غير معروف: ${action}`);

    const apiRes = await fetchWithTimeout(
      route.path,
      { method: route.method, headers, body: JSON.stringify(payload) },
      15_000,
    );

    let apiData: Record<string, unknown> = {};
    try { apiData = await apiRes.json(); } catch {
      throw new Error(`استجابة غير صالحة من API (HTTP ${apiRes.status})`);
    }

    if (!apiRes.ok) {
      throw new Error((apiData?.error as string) ?? `خطأ HTTP ${apiRes.status}`);
    }
    if (apiData?.error) throw new Error(apiData.error as string);
    return apiData;
  }

  throw new Error("تعذر تنفيذ العملية — يرجى المحاولة مجدداً");
}

export async function createAuthUser(data: {
  email: string;
  password: string;
  name: string;
  role: string;
  department: string;
  phone?: string | null;
  salary?: number | null;
  status?: string;
}): Promise<{ id: string }> {
  const result = await adminInvoke("create", data as Record<string, unknown>);
  return result as { id: string };
}

export async function deleteAuthUser(userId: string): Promise<void> {
  await adminInvoke("delete", { userId });
}

export async function updateAuthUser(userId: string, data: {
  role?: string;
  department?: string;
  isActive?: boolean;
  name?: string;
}): Promise<void> {
  await adminInvoke("update", { userId, ...data });
}

// ─── Board Members ─────────────────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "نشط" | "غير نشط";
}

export async function getBoardMembers(): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from("board_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BoardMember[];
}

export async function insertBoardMember(member: Omit<BoardMember, "id">): Promise<BoardMember> {
  const { data, error } = await supabase
    .from("board_members")
    .insert([member])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as BoardMember;
}

export async function updateBoardMember(id: string, changes: Partial<Omit<BoardMember, "id">>): Promise<void> {
  const { error } = await supabase.from("board_members").update(changes).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBoardMember(id: string): Promise<void> {
  const { error } = await supabase.from("board_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export interface DBMessage {
  id: string;
  sender_name: string;
  sender_avatar: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}

export async function getMessages(): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as DBMessage[];
}

export async function markMessageRead(id: string): Promise<void> {
  const { error } = await supabase.from("messages").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllMessagesReadInDB(): Promise<void> {
  const { error } = await supabase.from("messages").update({ read: true }).eq("read", false);
  if (error) throw new Error(error.message);
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export interface DBNotification {
  id: string;
  type: "task_due" | "task_late" | "client_followup" | "invoice_due";
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId?: string): Promise<DBNotification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  } else {
    query = query.is("user_id", null);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as DBNotification[];
}

export async function markNotificationReadInDB(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsReadInDB(userId?: string): Promise<void> {
  let q = supabase.from("notifications").update({ read: true }).eq("read", false);
  if (userId) q = q.eq("user_id", userId);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

// ─── User Profiles ─────────────────────────────────────────────────────────────

export interface DBProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  department: string;
  avatar?: string;
}

export async function getUserProfile(userId: string): Promise<DBProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .eq("id", userId)
    .single();
  return (data as DBProfile) ?? null;
}

export async function getAllProfiles(): Promise<DBProfile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, is_active, department, avatar")
    .order("name");
  return (data ?? []) as DBProfile[];
}

export async function updateProfileRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function toggleProfileStatus(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) throw new Error(error.message);
}

// ─── System Settings ───────────────────────────────────────────────────────────

export async function getSystemSettings(): Promise<Record<string, unknown>> {
  const { data } = await supabase.from("system_settings").select("key, value");
  const result: Record<string, unknown> = {};
  ((data ?? []) as { key: string; value: unknown }[]).forEach((row) => {
    result[row.key] = row.value;
  });
  return result;
}

export async function setSystemSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

// ─── Activity Log ───────────────────────────────────────────────────────────────

export async function logActivity(
  type: "employee" | "task" | "client" | "finance" | "project",
  description: string,
  icon?: string,
): Promise<void> {
  await supabase.from("activities").insert([{ type, description, icon }]);
}

// ─── Notifications ──────────────────────────────────────────────────────────────

export async function createNotification(
  type: "task_due" | "task_late" | "client_followup" | "invoice_due",
  title: string,
  body: string,
  href: string,
  userId?: string,
): Promise<void> {
  await supabase.from("notifications").insert([{
    type,
    title,
    body,
    href,
    user_id: userId ?? null,
  }]);
}
