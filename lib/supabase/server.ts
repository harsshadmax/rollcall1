import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Server Supabase client bound to the request cookies (RSC / Server Actions / Route Handlers). */
export async function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).");
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a Server Component render — safe to ignore; middleware refreshes cookies.
        }
      },
    },
  });
}
