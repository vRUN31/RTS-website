import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>> | undefined) => {
  const safeCookies = {
    getAll() {
      try {
        if (!cookieStore) return [];
        if (typeof cookieStore.getAll === 'function') return cookieStore.getAll();
      } catch (e) {
        // swallow
      }
      return [];
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
      try {
        if (!cookieStore) return;
        if (typeof cookieStore.set === 'function') {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          return;
        }
      } catch (e) {
        // Called from a Server Component where writing cookies is not allowed.
        // Safe to ignore if middleware refreshes sessions.
      }
    },
  };

  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: safeCookies as any,
    },
  );
};
