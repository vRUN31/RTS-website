import TruckStatusManager from '@/src/components/admin/TruckStatusManager.client';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import AdminShell from '@/src/app/admin/_admin-shell.client';

export const metadata = {
  title: 'Advanced Truck Status Management | Fleet',
  description: 'Advanced truck status management with bulk updates and history tracking',
};

export default async function FleetStatusPage() {
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

  return (
    <AdminShell>
      <div style={{ padding: '1rem 0' }}>
        <a 
          href="/admin/fleet"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            textDecoration: 'none',
            color: '#374151',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '1rem',
            transition: 'all 0.2s'
          }}
        >
          ← Back to Fleet Management
        </a>
      </div>
      <TruckStatusManager />
    </AdminShell>
  );
}
