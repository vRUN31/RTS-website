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
    const grain = (typeof searchParams?.grain === 'string' ? searchParams?.grain : 'month') as 'hour'|'day'|'month'|'year';
    const startParam = typeof searchParams?.start === 'string' ? searchParams?.start : undefined;
    const endParam = typeof searchParams?.end === 'string' ? searchParams?.end : undefined;
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

    return (
        <main className="dashboard-container">
            <h1 className="section-title text-center">Admin Dashboard</h1>

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
                    <a className="btn-dark" href={`/admin/export/shipments?start=${encodeURIComponent(startDate.toISOString())}&end=${encodeURIComponent(endDate.toISOString())}`}>Export CSV</a>
                </div>
            </div>

            {/* Date range picker */}
            <form className="row-gap-12 mt-12" action="/admin" method="get">
                <input type="hidden" name="grain" value={grain} />
                <label>
                    Start:
                    <input className="input" type="datetime-local" name="start" defaultValue={toLocalInputValue(startDate)} />
                </label>
                <label>
                    End:
                    <input className="input" type="datetime-local" name="end" defaultValue={toLocalInputValue(endDate)} />
                </label>
                <button className="btn-dark" type="submit">Apply</button>
            </form>

            {/* KPIs at a glance */}
            <section className="grid-3 mt-16">
                <div className="panel tight card-surface"><div className="panel-title">Trucks</div><div className="kpi-number">{trucksCount ?? '—'}</div></div>
                <div className="panel tight card-surface"><div className="panel-title">Shipments</div><div className="kpi-number">{shipmentsCount ?? '—'}</div></div>
                <div className="panel tight card-surface"><div className="panel-title">Contracts</div><div className="kpi-number">{contractsCount ?? '—'}</div></div>
            </section>

            <section className="grid-3 mt-16">
                <div className="panel tight card-surface"><div className="panel-title">On-time Delivery %</div><div className="kpi-number">{Number.isFinite(onTimePct) ? `${onTimePct}%` : '—'}</div></div>
                <div className="panel tight card-surface"><div className="panel-title">Avg Speed (km/h)</div><div className="kpi-number">{Number.isFinite(avgSpeedKph) ? avgSpeedKph : '—'}</div></div>
                <div className="panel tight card-surface"><div className="panel-title">Idling Hours</div><div className="kpi-number">{Number.isFinite(idlingHours) ? idlingHours : '—'}</div></div>
            </section>

            {/* Map */}
            <section className="mt-16 card-surface"><LeafletMap mode="admin" height={420} /></section>

            {/* Analytics & Charts */}
            <section className="mt-16 card-surface">
                <AdminAnalytics
                    shipmentsStatusCounts={shipmentsStatusCounts}
                    shipmentsPerMonth={shipmentsPerMonth}
                    distancePerMonth={distancePerMonth}
                    revenuePerMonth={revenuePerMonth}
                    trucksByStatus={trucksByStatus}
                />
            </section>

            {/* Recent shipments */}
            <section className="panel mt-16 card-surface">
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
