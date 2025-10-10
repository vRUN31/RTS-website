import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function validateAdmin() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore as any);

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/dashboard/customer');
}