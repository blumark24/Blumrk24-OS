"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getCurrentProfile,
  getCurrentSession,
  getUserPermissionKeys,
  signInWithEmailPassword,
  signOut as authSignOut,
  type UserProfile,
  type PermissionKey,
} from "@/lib/auth";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  forcePasswordChange: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  rawUser: User | null;
  profile: UserProfile | null;
  role: string;
  permissions: PermissionKey[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permissionKey: string) => boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearForcePasswordChange: () => Promise<void>;
}

const PUBLIC_PATHS = ["/", "/auth", "/demo"];
const APP_HOME_PATH = "/dashboard";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  rawUser: null,
  profile: null,
  role: "employee",
  permissions: [],
  loading: true,
  error: null,
  isAuthenticated: false,
  isSuperAdmin: false,
  hasPermission: () => false,
  login: async () => ({ ok: false }),
  logout: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  clearForcePasswordChange: async () => {},
});

function setSessionCookie(value: string) {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = `blumark_session=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = "blumark_session=; path=/; max-age=0; SameSite=Lax";
  }
}

function buildAuthUser(rawUser: User, profile: UserProfile | null): AuthUser {
  const email = rawUser.email ?? "";
  const role = (profile?.role ?? "employee").trim() || "employee";
  return {
    id: rawUser.id,
    email,
    name: profile?.full_name ?? profile?.name ?? email.split("@")[0] ?? "",
    role,
    avatar: profile?.avatar_url ?? profile?.avatar ?? undefined,
    forcePasswordChange: Boolean(profile?.force_password_change),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => (rawUser ? buildAuthUser(rawUser, profile) : null), [rawUser, profile]);
  const role = (profile?.role ?? user?.role ?? "employee").trim() || "employee";
  const isAuthenticated = Boolean(session && rawUser);
  const isSuperAdmin = role === "super_admin" || permissions.includes("*");

  const hasPermission = useCallback(
    (permissionKey: string) => {
      if (isSuperAdmin) return true;
      if (!permissionKey) return false;
      return permissions.includes(permissionKey);
    },
    [isSuperAdmin, permissions]
  );

  const hydrateFromSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setRawUser(null);
      setProfile(null);
      setPermissions([]);
      setSessionCookie("");
      return;
    }

    setRawUser(nextSession.user);
    const p = await getCurrentProfile(nextSession.user.id, nextSession.user.email);
    setProfile(p);

    if (p) {
      const keys = await getUserPermissionKeys(p);
      setPermissions(Array.from(new Set(keys)));
    } else {
      setPermissions([]);
    }

    setSessionCookie("1");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!rawUser) return;
    const p = await getCurrentProfile(rawUser.id, rawUser.email);
    setProfile(p);
    if (p) {
      const keys = await getUserPermissionKeys(p);
      setPermissions(Array.from(new Set(keys)));
    }
  }, [rawUser]);

  useEffect(() => {
    let mounted = true;

    getCurrentSession()
      .then(async (s) => {
        if (!mounted) return;
        await hydrateFromSession(s);
        setError(null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "فشل التحقق من الجلسة");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      try {
        await hydrateFromSession(nextSession);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "فشل تحديث الجلسة");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isAuthPage = pathname === "/auth";

    if (!isAuthenticated && !isPublic) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    } else if (isAuthenticated && isAuthPage) {
      router.replace(APP_HOME_PATH);
    } else if (user?.forcePasswordChange && pathname !== "/settings") {
      router.replace("/settings?tab=account");
    }
  }, [isAuthenticated, loading, pathname, router, user?.forcePasswordChange]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailPassword(email, password);
      const s = await getCurrentSession();
      await hydrateFromSession(s);
      const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
      const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : APP_HOME_PATH;
      router.replace(target);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "فشل تسجيل الدخول" };
    }
  }, [hydrateFromSession, router]);

  const logout = useCallback(async () => {
    await authSignOut();
    await hydrateFromSession(null);
    router.replace("/auth");
  }, [hydrateFromSession, router]);

  const clearForcePasswordChange = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getCurrentSession();
      if (s?.access_token) {
        await fetch("/api/auth/clear-force-pw", {
          method: "POST",
          headers: { Authorization: `Bearer ${s.access_token}` },
        });
      }
      setProfile((prev) => (prev ? { ...prev, force_password_change: false } : prev));
    } catch {
      // no-op
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        rawUser,
        profile,
        role,
        permissions,
        loading,
        error,
        isAuthenticated,
        isSuperAdmin,
        hasPermission,
        login,
        logout,
        signOut: logout,
        refreshProfile,
        clearForcePasswordChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
