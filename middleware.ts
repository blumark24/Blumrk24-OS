import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/auth", "/_next/", "/favicon.ico", "/api/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and API routes (APIs verify JWT themselves)
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check Supabase native session cookie (sb-<project-ref>-auth-token)
  const cookies = request.cookies.getAll();
  const hasSupabaseCookie = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Check our lightweight session signal set by AuthContext
  const hasSessionMarker = request.cookies.get("blumark_session")?.value === "1";

  if (!hasSupabaseCookie && !hasSessionMarker) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
