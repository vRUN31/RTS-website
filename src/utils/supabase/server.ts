import { createClient as createSupabase } from '@supabase/supabase-js';

export function createClient(cookieStore?: any) {
  // For server-side usage we still use the anon key here. In production you may inject
  // service_role or use server-only mechanisms. Keep keys out of client bundles.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabase(url, key);
}
