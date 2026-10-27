"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Browser Supabase client. Throws if called before a project is configured. */
export function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).");
  return createBrowserClient(env.url, env.anonKey);
}
