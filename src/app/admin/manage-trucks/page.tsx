import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

export default async function AdminManageTrucksLinkPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore as any);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard/customer');

  const { data: trucks } = await supabase.from('trucks').select('id, plate, status, driver_id').order('created_at', { ascending: false });
  const { data: drivers } = await supabase.from('drivers').select('id, name, phone, license_no').order('name', { ascending: true });

  async function linkAction(formData: FormData) {
    'use server';
    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore as any);
    const truckId = formData.get('truckId') as string;
    const driverId = formData.get('driverId') as string;
    if (!truckId) return;
    await supabase.from('trucks').update({ driver_id: driverId || null }).eq('id', truckId);
    redirect('/admin/manage-trucks');
  }

  return (
    <main className="p-2r">
      <h1 className="admin-title">Link Drivers to Trucks</h1>
      <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Plate</th>
            <th>Status</th>
            <th>Driver</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {(trucks ?? []).map((t: any) => (
            <tr key={t.id}>
              <td className="cell-id">{String(t.id).slice(0,8)}…</td>
              <td>{t.plate ?? '—'}</td>
              <td>{t.status ?? '—'}</td>
              <td>{t.driver_id ? (drivers ?? []).find((d: any) => d.id === t.driver_id)?.name ?? (String(t.driver_id).slice(0,8) + '…') : '—'}</td>
              <td>
                <form action={linkAction} className="row-gap-12-center">
                  <input type="hidden" name="truckId" value={t.id} />
                  <select name="driverId" aria-label="Select driver" defaultValue={t.driver_id ?? ''}>
                    <option value="">— Unassigned —</option>
                    {(drivers ?? []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name ?? String(d.id).slice(0,8)} — {d.phone ?? ''}</option>
                    ))}
                  </select>
                  <button className="btn-dark" type="submit">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </main>
  );
}
 

