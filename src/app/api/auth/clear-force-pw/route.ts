// Clears force_password_change for the authenticated caller's own profile.
// Uses the service role to bypass RLS (employees cannot self-update profiles).
// Verifies the caller's Bearer token before any DB write.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 500 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "Authorization header missing" }, { status: 401 });
  }

  const { data: { user }, error: tokenErr } = await admin.auth.getUser(authHeader.slice(7));
  if (tokenErr || !user) {
    return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 });
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ force_password_change: false })
    .eq("id", user.id);

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
