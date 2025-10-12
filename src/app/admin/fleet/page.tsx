import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import AdminShell from '@/src/app/admin/_admin-shell.client';
import FleetManagementClient from '@/src/components/fleet/FleetManagement.client';

export const dynamic = 'force-dynamic';

export default async function FleetManagementPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore as any);
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Check if user is admin
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error) redirect('/login');
  if (profile?.role !== 'admin') {
    redirect('/dashboard/customer');
  }
  
  return (
    <AdminShell>
      <FleetManagementClient />
    </AdminShell>
  );
}
