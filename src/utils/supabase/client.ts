import { createClient as createSupabase } from '@supabase/supabase-js';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    // Return a client that will throw on use if env missing; developer should set env vars
    return createSupabase('', '');
  }
  return createSupabase(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
      // Suppress refresh token errors in console (they're handled gracefully)
      debug: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'rts-website',
      },
    },
  });
}
