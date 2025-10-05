"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Shipment = {
    id: string;
    origin: string | null;
    destination: string | null;
    status: string | null;
    eta: string | null;
    cost: number | null;
    created_at: string;
};

export default function CustomerDashboardPage() {
    const [rows, setRows] = useState<Shipment[]>([]);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    useEffect(() => {
        let mounted = true;
        async function load() {
            setError(null);
            setLoading(true);
            try {
                if (!supabaseUrl || !supabaseAnonKey) {
                    if (mounted) setRows([]);
                } else {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    let clientId: string | undefined;
                    if (user?.id) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('client_id')
                            .eq('id', user.id)
                            .maybeSingle();
                        clientId = profile?.client_id as string | undefined;
                    }
                    const query = supabase
                        .from('shipments')
                        .select('id, origin, destination, status, eta, cost, created_at')
                        .order('created_at', { ascending: false })
                        .limit(100);
                    const { data, error } = clientId ? await query.eq('client_id', clientId) : await query;
                    if (error) throw error;
                    if (mounted) setRows(data as Shipment[]);
                }
            } catch (e: any) {
                if (mounted) setError(e?.message ?? 'Failed to load shipments');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [supabaseUrl, supabaseAnonKey]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        return rows.filter((r) => {
            const statusOk = status === 'all' || (r.status ?? '').toLowerCase() === status;
            const textOk = !term || [r.id, r.origin, r.destination, r.status].some((v) => (v ?? '').toString().toLowerCase().includes(term));
            return statusOk && textOk;
        });
    }, [rows, q, status]);

    return (
        <>
            {/* Minimal navbar matching the static prototype */}
                    <div className="navbar">
                        <div className="navbar-content">
                            <div className="logo">
                                <span className="logo-text" style={{ margin: 0 }}>RTS</span>
                            </div>
                            <nav>
                        <a href="#orders">Orders</a>
                        <a href="#support">Support</a>
                        <a href="#aboutus">About Us</a>
                    </nav>
                    <div className="actions" />
                </div>
            </div>

            <main className="dashboard-container">
                <div className="dashboard-header mb-18">Welcome to RAJMOHAN TRANSPORT SERVICES</div>
                <div className="grid-2-1">
                    {/* suppress hydration mismatches from password manager/browser extensions injecting attributes */}
                    <section suppressHydrationWarning>
                        <div className="panel" id="tracking">
                            <div className="panel-title">Live Tracking</div>
                            <div className="live-map">Map Placeholder</div>
                            <div className="progress">
                                <div className="fill" />
                            </div>
                            <div className="eta">ETA: 2 hrs 15 min</div>
                        </div>

                        <div className="panel" id="orders">
                            <div className="panel-title">Orders</div>
                            <div className="row-gap-12">
                                <input placeholder="Filter shipments..." className="filter-input" value={q} onChange={(e) => setQ(e.target.value)} />
                                <select className="filter-input" aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_transit">In Transit</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>
                            {loading && <div>Loading…</div>}
                            {error && (
                                <div role="alert">{error}</div>
                            )}
                            {!loading && !error && (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Origin</th>
                                            <th>Destination</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((row) => (
                                            <tr key={row.id}>
                                                <td>{row.id.slice(0, 8)}…</td>
                                                <td>{row.origin ?? '—'}</td>
                                                <td>{row.destination ?? '—'}</td>
                                                <td>{row.status ?? '—'}</td>
                                                <td>{row.created_at?.slice(0, 10)}</td>
                                                <td>{typeof row.cost === 'number' ? row.cost : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="panel" id="rate">
                            <div className="panel-title">Rate Calculator</div>
                            <div className="calc-column">
                                <input placeholder="Distance (km)" className="filter-input" />
                                <input placeholder="Weight (MT)" className="filter-input" />
                                <button className="btn-dark">Calculate</button>
                                <div className="eta">Estimated Price: —</div>
                            </div>
                        </div>
                    </section>

                    <aside className="col-gap-32">
                        <div className="panel" id="notifications">
                            <div className="panel-title">Notifications</div>
                            <ul>
                                <li>Shipment #1002 is in transit.</li>
                                <li>Payment pending for shipment #1003.</li>
                                <li>Support ticket #202 resolved.</li>
                            </ul>
                        </div>
                        <div className="panel" id="documents">
                            <div className="panel-title">Document Center</div>
                            <ul>
                                <li>Waybill</li>
                                <li>Invoice</li>
                                <li>PoD</li>
                                <li>Compliance</li>
                            </ul>
                        </div>
                                    <div className="panel" id="aboutus">
                            <div className="panel-title">About Us</div>
                                        <div className="text-primary text-1rem leading-17"><strong>Rajmohan Transport Services</strong> provides reliable, efficient, and safe transportation solutions. Real-time tracking, easy booking, and dedicated support.</div>
                        </div>
                        <div className="panel" id="support">
                            <div className="panel-title">Support</div>
                            <div className="row-gap-24">
                                <a className="btn-dark" href="#">Start Chat</a>
                                <a className="btn-dark" href="#">Report</a>
                                <a className="btn-dark" href="#">New Ticket</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}
