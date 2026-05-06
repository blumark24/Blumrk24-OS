import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId } from "@/lib/apiValidation";

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

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization header مفقود" }, { status: 401 });
  }

  const authError = await verifyAdmin(auth.slice(7));
  if (authError) return NextResponse.json({ error: authError }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const idError = validateUserId(body.userId);
  if (idError) return NextResponse.json({ error: idError }, { status: 400 });

  const userId = body.userId as string;

  let admin: ReturnType<typeof serviceClient>;
  try { admin = serviceClient(); }
  catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" }, { status: 500 });
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    const msg = error.message.toLowerCase().includes("not found")
      ? "المستخدم غير موجود في نظام المصادقة"
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
