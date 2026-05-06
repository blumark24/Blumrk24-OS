import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId, validateRole, validateName, firstError } from "@/lib/apiValidation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مضبوط — أضفه في Vercel → Project Settings → Environment Variables");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(token: string): Promise<string | null> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return "جلسة المستخدم غير صالحة أو انتهت";
  const email = user.email ?? "";
  if (ADMIN_EMAILS.includes(email)) return null;
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "super_admin") return null;
  return `غير مصرح — دورك (${profile?.role ?? "غير محدد"}) لا يملك هذه الصلاحية`;
}

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization header مفقود" }, { status: 401 });
  }

  const authError = await verifyAdmin(auth.slice(7));
  if (authError) return NextResponse.json({ error: authError }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const validationError = firstError(
    validateUserId(body.userId),
    validateRole(body.role),
    validateName(body.name),
  );
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { userId, role, department, isActive, name } = body as {
    userId: string;
    role?: string;
    department?: string;
    isActive?: boolean;
    name?: string;
  };

  // Sanitize optional fields
  const cleanDept     = typeof department === "string" ? department.slice(0, 100) : undefined;
  const cleanIsActive = typeof isActive === "boolean" ? isActive : undefined;
  const cleanName     = typeof name === "string" ? name.trim().slice(0, 100) : undefined;
  const cleanRole     = typeof role === "string" ? role : undefined;

  if (!cleanRole && !cleanDept && cleanIsActive === undefined && !cleanName) {
    return NextResponse.json({ error: "لا توجد حقول للتحديث" }, { status: 400 });
  }

  let admin: ReturnType<typeof serviceClient>;
  try { admin = serviceClient(); }
  catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" }, { status: 500 });
  }

  const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (cleanRole     !== undefined) profileUpdate.role       = cleanRole;
  if (cleanDept     !== undefined) profileUpdate.department = cleanDept;
  if (cleanIsActive !== undefined) profileUpdate.is_active  = cleanIsActive;
  if (cleanName     !== undefined) profileUpdate.name       = cleanName;

  const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", userId);
  if (profileError) {
    return NextResponse.json({ error: `فشل تحديث الملف الشخصي: ${profileError.message}` }, { status: 400 });
  }

  if (cleanName !== undefined) {
    await admin.auth.admin.updateUserById(userId, { user_metadata: { name: cleanName } });
  }

  return NextResponse.json({ ok: true });
}
