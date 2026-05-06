import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  validateEmail, validatePassword, validateRole, validateName, firstError,
} from "@/lib/apiValidation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY غير مضبوط — أضفه في Vercel → Project Settings → Environment Variables"
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(token: string): Promise<{ userId: string; email: string } | { error: string }> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { error: "جلسة المستخدم غير صالحة أو انتهت" };
  const email = user.email ?? "";
  if (ADMIN_EMAILS.includes(email)) return { userId: user.id, email };
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "super_admin") return { userId: user.id, email };
  return { error: `غير مصرح — دورك (${profile?.role ?? "غير محدد"}) لا يملك صلاحية إنشاء المستخدمين` };
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization header مفقود" }, { status: 401 });
  }
  const identity = await verifyAdmin(auth.slice(7));
  if ("error" in identity) {
    return NextResponse.json({ error: identity.error }, { status: 403 });
  }

  // 2. Parse + validate body
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const validationError = firstError(
    validateEmail(body.email),
    validatePassword(body.password),
    validateRole(body.role),
    validateName(body.name),
  );
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const email      = (body.email      as string).trim().toLowerCase();
  const password   = body.password    as string;
  const name       = typeof body.name === "string" ? body.name.trim() : email.split("@")[0];
  const role       = typeof body.role === "string" ? body.role : "employee";
  const department = typeof body.department === "string" ? body.department.slice(0, 100) : "";
  const phone      = typeof body.phone  === "string" ? body.phone.slice(0, 20) : null;
  const salary     = typeof body.salary === "number" && body.salary >= 0 ? body.salary : null;
  const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

  // 3. Service client
  let admin: ReturnType<typeof serviceClient>;
  try { admin = serviceClient(); }
  catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" }, { status: 500 });
  }

  // 4. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "هذا البريد الإلكتروني مسجل مسبقاً"
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // 5. Upsert profile (rollback on failure)
  const { error: profileError } = await admin.from("profiles").upsert(
    { id: userId, email, name, role, department, is_active: true, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `فشل إنشاء الملف الشخصي: ${profileError.message}` }, { status: 500 });
  }

  // 6. Insert employee record (rollback on failure)
  const { error: empError } = await admin.from("employees").insert([{
    id: userId, name, email, phone, department, role, status,
    join_date: new Date().toISOString().split("T")[0],
    performance: 3, tasks: 0, completed_tasks: 0, salary,
  }]);
  if (empError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `فشل إنشاء سجل الموظف: ${empError.message}` }, { status: 500 });
  }

  return NextResponse.json({ id: userId, name });
}
