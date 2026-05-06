import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_PREFIXES = ["/auth", "/api/", "/_next/", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and API routes
  // (API routes do their own token verification)
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for the session signal cookie set by AuthContext
  const session = req.cookies.get("blumark_session");
  if (!session?.value) {
    const loginUrl = new URL("/auth", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
