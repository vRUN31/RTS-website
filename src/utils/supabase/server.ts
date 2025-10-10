
import { createClient as createSupabase } from '@supabase/supabase-js';

// Small wrapper that creates a Supabase client for server-side usage.
// If a `cookieStore` (from `next/headers` cookies() or a ResponseCookies) is
// provided we expose a minimal storage adapter so the GoTrue client can read
// and (best-effort) write session cookies. If no cookieStore is provided the
// client is created without persistent storage.
export function createClient(cookieStore?: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const options: Record<string, any> = {};

  if (cookieStore) {
    const storage = {
      // read a single cookie value by name
      getItem: (name: string) => {
        try {
          // Next's RequestCookies has .get(name) -> Cookie | undefined
          if (typeof cookieStore.get === 'function') {
            const c = cookieStore.get(name);
            return c?.value ?? null;
          }
          // Some runtimes expose getAll()
          if (typeof cookieStore.getAll === 'function') {
            const all = cookieStore.getAll();
            const found = (all ?? []).find((x: any) => x?.name === name);
            return found?.value ?? null;
          }
        } catch (e) {
          // swallow
        }
        return null;
      },
      // try to set a cookie (best-effort). In many server contexts RequestCookies
      // is read-only; ResponseCookies supports set(). We'll attempt supported APIs
      // and otherwise no-op.
      setItem: (name: string, value: string) => {
        try {
          if (typeof cookieStore.set === 'function') {
            // ResponseCookies.set(name, value) or similar
            // Some implementations accept options as third arg; keep minimal.
            cookieStore.set(name, value);
            return;
          }
          // fallback: if cookieStore.add exists
          if (typeof cookieStore.add === 'function') {
            cookieStore.add({ name, value });
            return;
          }
        } catch (e) {
          // ignore
        }
      },
      removeItem: (name: string) => {
        try {
          if (typeof cookieStore.delete === 'function') {
            cookieStore.delete(name);
            return;
          }
          if (typeof cookieStore.remove === 'function') {
            cookieStore.remove(name);
            return;
          }
        } catch (e) {
          // ignore
        }
      }
    };

    options.auth = { storage };
  }

  return createSupabase(url, key, options);
}
