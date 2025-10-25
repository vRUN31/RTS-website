
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';

import LeafletMap from '@/src/components/map/LeafletMap.client';
import BookingActionRow from '@/src/components/admin/BookingActionRow.client';
import OpenAssignTruckModalListener from '@/src/components/admin/OpenAssignTruckModalListener.client';
import RecentShipmentsTable from '@/src/components/admin/RecentShipmentsTable.client';
import TruckStatusSummary from '@/src/components/admin/TruckStatusSummary.client';
import AdminShell from './_admin-shell.client';
import AdminDashboardLinks from './_dashboard-links.client';
import BackButton from '@/src/components/_back-button.client';

export default async function AdminDashboard({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
    // SSR guard: only admins may access
    const cookieStore = await cookies();
    const supabase = createServerSupabase(cookieStore as any);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
    if (error) redirect('/login');
    if (profile?.role !== 'admin') redirect('/dashboard/customer');

    // Date range and grain controls
    const now = new Date();
    // `searchParams` may be a dynamic/special object in Next; await it first per Next.js guidance
    const params = (await (searchParams as unknown)) as Record<string, string | string[] | undefined> | undefined;
    const range = (typeof params?.range === 'string' ? params?.range : 'month') as 'hour'|'day'|'month'|'year';
    const grain = (typeof params?.grain === 'string' ? params?.grain : range) as 'hour'|'day'|'month'|'year';
    const startParam = typeof params?.start === 'string' ? params?.start : undefined;
    const endParam = typeof params?.end === 'string' ? params?.end : undefined;
    const endDate = endParam ? new Date(endParam) : now;
    const startDate = startParam ? new Date(startParam) : new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Basic KPIs
    const { count: trucksCount } = await supabase
        .from('trucks')
        .select('id', { count: 'exact', head: true });

    const { count: shipmentsCount } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    const { count: contractsCount } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true });

    // Recent shipments
    const { data: recentShipments } = await supabase
        .from('shipments')
        .select('id, origin, destination, status, created_at, client_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(8);

    // On-time %
    const { data: deliveredShipments } = await supabase
        .from('shipments')
        .select('id, eta, delivered_at')
        .eq('status', 'delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    let onTimePct = 0;
    if (deliveredShipments && deliveredShipments.length > 0) {
        const onTimeCount = deliveredShipments.filter(s => s.delivered_at && s.eta && new Date(s.delivered_at) <= new Date(s.eta)).length;
        onTimePct = Math.round((onTimeCount / deliveredShipments.length) * 100);
    }

    // Telemetry KPIs
    const { data: telemetryRows } = await supabase
        .from('telemetry')
        .select('truck_id, ts, speed')
        .gte('ts', startDate.toISOString())
        .lte('ts', endDate.toISOString())
        .order('truck_id', { ascending: true })
        .order('ts', { ascending: true });
    let avgSpeedKph = 0;
    let idlingHours = 0;
    if (telemetryRows && telemetryRows.length > 0) {
        const speeds = telemetryRows.map(r => Number(r.speed) || 0);
        avgSpeedKph = Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10;
        for (let i = 1; i < telemetryRows.length; i++) {
            const prev = telemetryRows[i - 1];
            const curr = telemetryRows[i];
            if (prev.truck_id !== curr.truck_id) continue;
            const prevSpeed = Number(prev.speed) || 0;
            const currSpeed = Number(curr.speed) || 0;
            if (prevSpeed <= 2 && currSpeed <= 2) {
                const dtMs = new Date(curr.ts).getTime() - new Date(prev.ts).getTime();
                if (dtMs > 0 && dtMs < 1000 * 60 * 60 * 6) idlingHours += dtMs / (1000 * 60 * 60);
            }
        }
        idlingHours = Math.round(idlingHours * 10) / 10;
    }

    // Aggregations
    const shipmentsStatusCounts: Record<string, number> = {};
    for (const s of ['pending', 'in_transit', 'delivered']) {
        const { count } = await supabase
            .from('shipments')
            .select('id', { count: 'exact', head: true })
            .eq('status', s)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        shipmentsStatusCounts[s] = count ?? 0;
    }

    const { data: spm } = await supabase
        .from('shipments')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
    const spmBuckets: Map<string, number> = new Map();
    (spm ?? []).forEach((row) => {
        const d = new Date(row.created_at);
        const key = bucketKey(d, grain);
        spmBuckets.set(key, (spmBuckets.get(key) ?? 0) + 1);
    });
    const shipmentsPerMonth = { labels: Array.from(spmBuckets.keys()), values: Array.from(spmBuckets.values()) };

    const { data: dpm } = await supabase
        .from('shipments')
        .select('created_at, distance_km')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
    const dpmBuckets: Map<string, number> = new Map();
    (dpm ?? []).forEach((row) => {
        const d = new Date(row.created_at);
        const key = bucketKey(d, grain);
        const val = Number(row.distance_km) || 0;
        dpmBuckets.set(key, (dpmBuckets.get(key) ?? 0) + val);
    });
    const distancePerMonth = { labels: Array.from(dpmBuckets.keys()), values: Array.from(dpmBuckets.values()) };

    const { data: rpm } = await supabase
        .from('shipments')
        .select('created_at, cost')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
    const rpmBuckets: Map<string, number> = new Map();
    (rpm ?? []).forEach((row) => {
        const d = new Date(row.created_at);
        const key = bucketKey(d, grain);
        const val = Number(row.cost) || 0;
        rpmBuckets.set(key, (rpmBuckets.get(key) ?? 0) + val);
    });
    const revenuePerMonth = { labels: Array.from(rpmBuckets.keys()), values: Array.from(rpmBuckets.values()) };

    const trucksByStatus: Record<string, number> = {};
    for (const s of ['running', 'halt', 'offline']) {
        const { count } = await supabase
            .from('trucks')
            .select('id', { count: 'exact', head: true })
            .eq('status', s);
        trucksByStatus[s] = count ?? 0;
    }

    // Fetch all pending (submitted) bookings for admin review
    // Fetch pending bookings for admin review (no join)
    const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('id, user_id, client_id, source_city, destination_city, vehicle_type, material, weight_mt, pickup_date, notes, status, created_at')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

    // Build display labels for "Client/User" column
    const userIds = Array.from(new Set((pendingBookings ?? []).map(b => b.user_id).filter(Boolean)));
    const clientIds = Array.from(new Set((pendingBookings ?? []).map(b => b.client_id).filter(Boolean)));

    let profileLabelById: Record<string, string | null> = {};
    if (userIds.length > 0) {
        const { data: profilesList } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);
        profileLabelById = Object.fromEntries((profilesList ?? []).map((p: any) => {
            const label = p.name?.trim() || p.email?.trim() || null;
            return [p.id, label];
        }));
    }

    let clientNameById: Record<string, string | null> = {};
    if (clientIds.length > 0) {
        const { data: clientsList } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', clientIds);
        clientNameById = Object.fromEntries((clientsList ?? []).map((c: any) => [c.id, c.name ?? null]));
    }

    async function handleBookingAction(bookingId: string, action: 'approved' | 'rejected') {
        'use server';
        const cookieStore = await cookies();
        const supabase = createServerSupabase(cookieStore as any);
        await supabase
            .from('bookings')
            .update({ status: action })
            .eq('id', bookingId);
        // Optionally: notify client here
        redirect('/admin');
    }

    return (
        <AdminShell>
            <main className="dashboard-container">
                <div className="page-header-back">
                    <BackButton label="Back to Home" fallbackUrl="/" />
                </div>

                <div className="row-center my-32">
                    <h1 className="admin-welcome">
                        Welcome back, Admin!!
                    </h1>
                </div>

            {/* Quick filters and actions */}
            <div className="row-between mt-16">
                <div className="row-gap-12">
                    <a className="btn-dark no-underline" href={`/admin?range=hour&grain=hour`}>Last Hour</a>
                    <a className="btn-dark no-underline" href={`/admin?range=day&grain=day`}>Last Day</a>
                    <a className="btn-dark no-underline" href={`/admin?range=month&grain=month`}>Last 6 Months</a>
                    <a className="btn-dark no-underline" href={`/admin?range=year&grain=month`}>Year to Date</a>
                </div>
                <div className="row-gap-12">
                    <a className="btn-dark no-underline" href={`/contracts`}>Create Contract</a>
                    <a className="btn-dark no-underline" href={`/admin/export/shipments?start=${encodeURIComponent(startDate.toISOString())}&end=${encodeURIComponent(endDate.toISOString())}`}>Export Shipments CSV</a>
                </div>
            </div>

            <div className="mt-16 row-between">
                <form className="row-gap-12-center" action="/admin" method="get">
                    <input type="hidden" name="grain" value={grain} />
                    <label className="text-muted">
                        Start:
                        <input className="input-text" type="datetime-local" name="start" defaultValue={toLocalInputValue(startDate)} />
                    </label>
                    <label className="text-muted">
                        End:
                        <input className="input-text" type="datetime-local" name="end" defaultValue={toLocalInputValue(endDate)} />
                    </label>
                    <button className="btn-dark" type="submit">Apply</button>
                </form>
            </div>

            <section className="grid-3 mt-16">
                <div className="panel">
                    <div className="panel-title">Trucks</div>
                    <div className="dashboard-header">{trucksCount ?? '—'}</div>
                </div>
                <div className="panel">
                    <div className="panel-title">Shipments</div>
                    <div className="dashboard-header">{shipmentsCount ?? '—'}</div>
                </div>
                <div className="panel">
                    <div className="panel-title">Contracts</div>
                    <div className="dashboard-header">{contractsCount ?? '—'}</div>
                </div>
            </section>

            <section className="grid-3 mt-16">
                <div className="panel">
                    <div className="panel-title">On-time Delivery %</div>
                    <div className="dashboard-header">{Number.isFinite(onTimePct) ? `${onTimePct}%` : '—'}</div>
                </div>
                <div className="panel">
                    <div className="panel-title">Avg Speed (km/h)</div>
                    <div className="dashboard-header">{Number.isFinite(avgSpeedKph) ? avgSpeedKph : '—'}</div>
                </div>
                <div className="panel">
                    <div className="panel-title">Idling Hours</div>
                    <div className="dashboard-header">{Number.isFinite(idlingHours) ? idlingHours : '—'}</div>
                </div>
            </section>

            <div className="mt-16">
                <LeafletMap mode="admin" height={420} />
            </div>

            {/* Truck Status Summary Widget */}
            <section className="mt-16">
                <TruckStatusSummary />
            </section>

            {/* Link to analytics page, Fleet Management, and Support Chat */}
            <AdminDashboardLinks userId={user.id} />

            <section className="panel mt-16">
                <div className="panel-title">Recent Shipments</div>
                <RecentShipmentsTable initialShipments={recentShipments ?? []} />
            </section>

            {/* Manage Book Truck Requests */}
            <section className="admin-bookings-panel mt-16">
                <div className="panel-title">Manage Book Truck Requests</div>
                {pendingBookings && pendingBookings.length > 0 ? (
                    <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Client/User</th>
                                <th>Source</th>
                                <th>Destination</th>
                                <th>Vehicle</th>
                                <th>Weight</th>
                                <th>Pickup</th>
                                <th>Material</th>
                                <th>Notes</th>
                                <th>Requested</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingBookings.map((b: any) => {
                                                                const label = clientNameById[b.client_id as string]
                                                                    || profileLabelById[b.user_id as string]
                                                                    || (b.user_id ? `${String(b.user_id).slice(0,8)}…` : '—');
                                return <BookingActionRow key={b.id} booking={b} displayName={label} />
                            })}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <div className="muted-small">No pending booking requests.</div>
                )}
            </section>

            {/* Page-level modal handler to avoid rendering inside <tbody> */}
            <OpenAssignTruckModalListener />
        </main>
        </AdminShell>
    );
}

function bucketKey(d: Date, grain: 'hour'|'day'|'month'|'year') {
    if (grain === 'hour') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`;
    if (grain === 'day') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (grain === 'year') return `${d.getFullYear()}`;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function toLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Client-only listener moved to a dedicated Client Component file
