import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import AdminShell from '@/src/app/admin/_admin-shell.client';
import FleetManagementWithSelection from '@/src/components/fleet/FleetManagementWithSelection.client';

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

  // Fetch all trucks with driver information
  const { data: trucksData } = await supabase
    .from('trucks')
    .select('id, display_code, plate, status, vehicle_type, location, driver_id')
    .order('display_code', { ascending: true })
    .limit(1000);

  const rows = (trucksData ?? []) as any[];
  const driverIds = Array.from(new Set(rows.map(r => r.driver_id).filter(Boolean)));
  let driverMap: Record<string, any> = {};
  
  if (driverIds.length > 0) {
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, name, phone')
      .in('id', driverIds);
    driverMap = Object.fromEntries((drivers ?? []).map((d: any) => [d.id, d]));
  }

  const trucks = rows.map(r => ({
    ...r,
    driver: r.driver_id ? driverMap[r.driver_id] ?? null : null,
  }));
  
  return (
    <AdminShell>
      <FleetManagementWithSelection trucks={trucks} />
    </AdminShell>
  );
}
