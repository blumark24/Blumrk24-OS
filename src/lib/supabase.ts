import { createClient } from "@supabase/supabase-js";

type WindowWithSB = { __SB_URL__?: string; __SB_KEY__?: string };

function getSupabaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (typeof window !== "undefined") {
    const url = (window as unknown as WindowWithSB).__SB_URL__;
    if (url) return url;
  }
  return "";
}

function getSupabaseKey(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof window !== "undefined") {
    const key = (window as unknown as WindowWithSB).__SB_KEY__;
    if (key) return key;
  }
  return "";
}

const supabaseUrl = getSupabaseUrl() || "https://placeholder.supabase.co";
const supabaseKey = getSupabaseKey() || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof window !== "undefined" && !!(window as unknown as WindowWithSB).__SB_URL__);
