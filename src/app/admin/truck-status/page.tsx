import TruckStatusManager from '@/src/components/admin/TruckStatusManager.client';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export const metadata = {
  title: 'Truck Status Management | Admin',
  description: 'Advanced truck status management with bulk updates and history tracking',
};

export default async function TruckStatusPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore as any);
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard/customer');
  }

  return <TruckStatusManager />;
}
