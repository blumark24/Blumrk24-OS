"use client";

import MarketingLanding from "@/components/landing/MarketingLanding";

// `/` is a public marketing surface.  It must remain renderable without any
// AuthContext / PermissionsContext / Supabase / Dashboard dependency so that
// the homepage is fast and resilient to backend or auth problems.  Auth gating
// for `/dashboard` and other internal routes is handled by middleware.ts and
// the per-route guards.
export default function HomePage() {
  return <MarketingLanding />;
}
