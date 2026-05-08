// /api/admin/create-user
// Production-safe rewrite. Every path returns Response.json, env read in handler,
// service-role only (no anon client), top-level try/catch, force-dynamic.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TAG          = "[create-user]";
const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

const ARABIC_TO_ROLE: Record<string, string> = {
  "مدير أعلى":          "super_admin",
  "مدير عام":           "super_admin",
  "عضو مجلس الإدارة":  "board_member",
  "مدير الدفاع":         "defense_manager",
  "مدير وكالة الدفاع":  "defense_manager",
  "مدير الهجوم":         "attack_manager",
  "مدير وكالة الهجوم":  "attack_manager",
  "مدير المالية":        "finance_manager",
  "مدير مالي":           "finance_manager",
  "موظف":                "employee",
};

const VALID_ROLES = new Set([
  "super_admin", "board_member", "defense_manager",
  "attack_manager", "finance_manager", "employee",
]);

function jsonOk(data: Record<string, unknown> = {}) {
  return Response.json({ success: true, ...data });
}

function jsonErr(status: number, error: string, debug?: string) {
  if (debug) console.error(`${TAG} HTTP ${status} | ${error} | ${debug}`);
  else       console.error(`${TAG} HTTP ${status} | ${error}`);
  const body: Record<string, unknown> = { success: false, error };
  if (debug) body.debug = debug;
  return Response.json(body, { status });
}

function cleanEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\s/g, "")
    .trim()
    .toLowerCase();
}

function validatePassword(pw: unknown): string | null {
  if (typeof pw !== "string" || !pw) return "كلمة المرور مطلوبة";
  if (pw.length < 8)                  return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (pw.length > 128)                return "كلمة المرور طويلة جداً";
  if (!/[A-Z]/.test(pw))              return "كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)";
  if (!/[a-z]/.test(pw))              return "كلمة المرور يجب أن تحتوي على حرف صغير (a-z)";
  if (!/[0-9]/.test(pw))              return "كلمة المرور يجب أن تحتوي على رقم (0-9)";
  if (!/[^A-Za-z0-9]/.test(pw))       return "كلمة المرور يجب أن تحتوي على رمز (!@#$...)";
  return null;
}

export async function POST(req: Request) {
  console.log(`${TAG} start`);

  try {
    // 1. Read env vars INSIDE the handler
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return jsonErr(
        500,
        "إعداد الخادم غير مكتمل — أضف SUPABASE_SERVICE_ROLE_KEY و NEXT_PUBLIC_SUPABASE_URL في Vercel Environment Variables",
        `urlSet=${!!SUPABASE_URL} keySet=${!!SERVICE_KEY}`,
      );
    }
    console.log(`${TAG} env loaded | URL=${!!SUPABASE_URL} SERVICE_KEY=${!!SERVICE_KEY}`);

    // 2. Build the only client we use (service role — no anon path)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Verify caller via service-role admin API (NO anon JWT validation)
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonErr(401, "Authorization header مفقود — يرجى تسجيل الدخول مجدداً", "no Bearer prefix");
    }
    const token = authHeader.slice(7);
    const { data: tokenData, error: tokenErr } = await admin.auth.getUser(token);
    if (tokenErr || !tokenData?.user) {
      return jsonErr(401, "جلسة المستخدم غير صالحة أو انتهت", `getUser: ${tokenErr?.message ?? "no user"}`);
    }
    const callerEmail = tokenData.user.email ?? "";
    let isAdmin = ADMIN_EMAILS.includes(callerEmail);
    if (!isAdmin) {
      const { data: prof } = await admin
        .from("profiles")
        .select("role")
        .eq("id", tokenData.user.id)
        .maybeSingle();
      isAdmin = prof?.role === "super_admin";
    }
    if (!isAdmin) {
      return jsonErr(
        403,
        "غير مصرح — هذه العملية تتطلب صلاحيات المدير الأعلى",
        `caller=${callerEmail} id=${tokenData.user.id}`,
      );
    }
    console.log(`${TAG} caller verified | email=${callerEmail}`);

    // 4. Parse body
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch (e) {
      return jsonErr(400, "طلب غير صالح — تعذر قراءة البيانات المرسلة", `parse: ${String(e)}`);
    }
    console.log(`${TAG} request parsed`);

    // 5. Validate
    const email = cleanEmail(body.email);
    if (!email)                                    return jsonErr(400, "البريد الإلكتروني مطلوب");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonErr(400, "البريد الإلكتروني غير صالح");
    if (email.length > 254)                        return jsonErr(400, "البريد الإلكتروني طويل جداً");

    const pwErr = validatePassword(body.password);
    if (pwErr) return jsonErr(400, pwErr);

    const rawRole = typeof body.role === "string" ? body.role : "employee";
    const role    = ARABIC_TO_ROLE[rawRole] ?? rawRole;
    if (!VALID_ROLES.has(role)) {
      return jsonErr(400, `الدور غير مقبول: ${rawRole}`, `mapped=${role}`);
    }

    const password   = body.password as string;
    const name       = typeof body.name === "string" && body.name.trim()
                          ? body.name.trim().slice(0, 100)
                          : email.split("@")[0];
    const department = typeof body.department === "string" ? body.department.slice(0, 100) : "";
    const phone      = typeof body.phone === "string" ? body.phone.slice(0, 20) : null;
    const salary     = typeof body.salary === "number" && body.salary >= 0 ? body.salary : null;
    const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

    // 6. Create auth user
    console.log(`${TAG} creating auth user | email=${email} role=${role}`);
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "تعذر إنشاء حساب المصادقة";
      const lower = msg.toLowerCase();
      const dup = lower.includes("already") || lower.includes("registered")
               || lower.includes("exists")  || lower.includes("duplicate");
      return jsonErr(
        400,
        dup
          ? `البريد الإلكتروني (${email}) مسجل مسبقاً`
          : `فشل إنشاء الحساب: ${msg}`,
        `auth.admin.createUser: ${msg}`,
      );
    }
    const userId = created.user.id;
    console.log(`${TAG} auth create success | userId=${userId}`);

    // 7. Upsert profile (rollback auth user on failure)
    const { error: profErr } = await admin.from("profiles").upsert(
      { id: userId, email, name, role, department, is_active: true },
      { onConflict: "id" },
    );
    if (profErr) {
      console.error(`${TAG} profiles upsert failed | ${profErr.message} — rolling back auth user`);
      await admin.auth.admin.deleteUser(userId).catch((e) => {
        console.error(`${TAG} rollback (after profile error) failed: ${(e as Error)?.message ?? e}`);
      });
      return jsonErr(500, `فشل إنشاء الملف الشخصي: ${profErr.message}`, `profiles.upsert: ${profErr.message}`);
    }

    // 8. Upsert employee (rollback auth user on failure)
    const { error: empErr } = await admin.from("employees").upsert(
      [{
        id:              userId,
        name,
        email,
        phone,
        department,
        role,
        status,
        salary,
        join_date:       new Date().toISOString().split("T")[0],
        performance:     3,
        tasks:           0,
        completed_tasks: 0,
      }],
      { onConflict: "id" },
    );
    if (empErr) {
      console.error(`${TAG} employees upsert failed | ${empErr.message} — rolling back auth user`);
      await admin.auth.admin.deleteUser(userId).catch((e) => {
        console.error(`${TAG} rollback (after employees error) failed: ${(e as Error)?.message ?? e}`);
      });
      return jsonErr(500, `فشل إنشاء سجل الموظف: ${empErr.message}`, `employees.upsert: ${empErr.message}`);
    }
    console.log(`${TAG} db insert success | userId=${userId}`);

    // 9. Final
    console.log(`${TAG} SUCCESS | email=${email} userId=${userId}`);
    return jsonOk({ id: userId, name });

  } catch (err) {
    const msg   = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack   : undefined;
    console.error(`${TAG} CATCH | ${msg}\n${stack ?? ""}`);
    return Response.json(
      { success: false, error: `خطأ داخلي: ${msg}` },
      { status: 500 },
    );
  }
}
