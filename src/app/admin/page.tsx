import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import LeafletMap from '@/src/components/map/LeafletMap.client';
import AdminAnalytics from '@/src/components/admin/AdminAnalytics.client';

export default async function AdminDashboard({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
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
        .select('id, origin, destination, status, created_at')
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
        <main className="dashboard-container">
            <h1 className="panel-title">Admin Dashboard</h1>

            {/* Quick filters and actions */}
            <div className="row-between mt-16">
                <div className="row-gap-12">
                    <a className="btn-dark" href={`/admin?range=hour&grain=hour`}>Last Hour</a>
                    <a className="btn-dark" href={`/admin?range=day&grain=day`}>Last Day</a>
                    <a className="btn-dark" href={`/admin?range=month&grain=month`}>Last 6 Months</a>
                    <a className="btn-dark" href={`/admin?range=year&grain=month`}>Year to Date</a>
                </div>
                <div className="row-gap-12">
                    <a className="btn-dark" href={`/contracts`}>Create Contract</a>
                    <a className="btn-dark" href={`/admin/export/shipments?start=${encodeURIComponent(startDate.toISOString())}&end=${encodeURIComponent(endDate.toISOString())}`}>Export Shipments CSV</a>
                </div>
            </div>

            <div className="mt-16 row-between">
                <div className="row-gap-12">
                    <a className="pill" href={`/admin?range=hour&grain=hour`}>Last Hour</a>
                    <a className="pill" href={`/admin?range=day&grain=day`}>Last Day</a>
                    <a className="pill" href={`/admin?range=month&grain=month`}>Last 6 Months</a>
                    <a className="pill" href={`/admin?range=year&grain=month`}>Year to Date</a>
                </div>
                <form className="row-gap-12" action="/admin" method="get" style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
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

            {/* Analytics & Charts */}
            <AdminAnalytics
                shipmentsStatusCounts={shipmentsStatusCounts}
                shipmentsPerMonth={shipmentsPerMonth}
                distancePerMonth={distancePerMonth}
                revenuePerMonth={revenuePerMonth}
                trucksByStatus={trucksByStatus}
            />

            <section className="panel mt-16">
                <div className="panel-title">Recent Shipments</div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(recentShipments ?? []).map((s) => (
                            <tr key={s.id}>
                                <td>{String(s.id).slice(0,8)}…</td>
                                <td>{s.origin ?? '—'}</td>
                                <td>{s.destination ?? '—'}</td>
                                <td>{s.status ?? '—'}</td>
                                <td>{s.created_at?.slice(0,10) ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Manage Book Truck Requests */}
            <section className="admin-bookings-panel mt-16">
                <div className="panel-title">Manage Book Truck Requests</div>
                {pendingBookings && pendingBookings.length > 0 ? (
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
                            {pendingBookings.map((b: any) => (
                                <tr key={b.id}>
                                    <td>{String(b.id).slice(0,8)}…</td>
                                    <td>{b.client_id || b.user_id || '—'}</td>
                                    <td>{b.source_city ?? '—'}</td>
                                    <td>{b.destination_city ?? '—'}</td>
                                    <td>{b.vehicle_type ?? '—'}</td>
                                    <td>{b.weight_mt ?? '—'}</td>
                                    <td>{b.pickup_date?.slice(0,10) ?? '—'}</td>
                                    <td>{b.material ?? '—'}</td>
                                    <td>{b.notes ?? '—'}</td>
                                    <td>{b.created_at?.slice(0,10) ?? '—'}</td>
                                    <td className="action-cell">
                                        <form action={handleBookingAction.bind(null, b.id, 'approved')} method="post">
                                            <button className="btn-dark" type="submit">Approve</button>
                                        </form>
                                        <form action={handleBookingAction.bind(null, b.id, 'rejected')} method="post">
                                            <button className="btn-dark" type="submit">Reject</button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="muted-small">No pending booking requests.</div>
                )}
            </section>
        </main>
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
