"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';

const LeafletMap = dynamic(() => import('@/src/components/map/LeafletMap.client'), { ssr: false });

type Shipment = {
    id: string;
    origin: string | null;
    destination: string | null;
    status: string | null;
    eta: string | null;
    cost: number | null;
    created_at: string;
};

type Booking = {
    id: string;
    source_city: string | null;
    destination_city: string | null;
    weight_mt: number | null;
    pickup_date: string | null;
    status: string | null;
    created_at: string;
};

export default function CustomerDashboardPage() {
    const [rows, setRows] = useState<Shipment[]>([]);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsError, setBookingsError] = useState<string | null>(null);
    const [reloadBookings, setReloadBookings] = useState(0);
    const [placing, setPlacing] = useState(false);
    const [showPlaceOrder, setShowPlaceOrder] = useState(false);
    const [guestMode, setGuestMode] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [placeError, setPlaceError] = useState<string | null>(null);
    const [placeSuccess, setPlaceSuccess] = useState<string | null>(null);
    const [form, setForm] = useState({
        source_city: '',
        destination_city: '',
        vehicle_type: '',
        material: '',
        weight_mt: '',
        pickup_date: '',
        notes: '',
    });
    // Rate calculator state
    const [rateVehicle, setRateVehicle] = useState('Pickup (1.5T)');
    const [rateDistance, setRateDistance] = useState('');
    const [rateWeight, setRateWeight] = useState('');
    const [rateEstimate, setRateEstimate] = useState<string>('—');
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
                        setClientId(profile?.client_id ?? null);
                        setUserId(user.id);
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

    // detect guest=true in URL
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            setGuestMode(params.get('guest') === 'true');
        } catch { /* ignore */ }
    }, []);

    // Load bookings for this user/client
    useEffect(() => {
        let mounted = true;
        async function loadBookings() {
            setBookingsError(null);
            try {
                if (!supabaseUrl || !supabaseAnonKey) {
                    if (mounted) setBookings([]);
                    return;
                }
                const supabase = createClient();
                setBookingsLoading(true);
                const base = supabase
                    .from('bookings')
                    .select('id, source_city, destination_city, weight_mt, pickup_date, status, created_at')
                    .order('created_at', { ascending: false })
                    .limit(50);
                let res;
                if (clientId) {
                    res = await base.eq('client_id', clientId);
                } else if (userId) {
                    res = await base.eq('user_id', userId);
                } else {
                    if (mounted) setBookings([]);
                    return;
                }
                const { data, error } = res;
                if (error) throw error;
                if (mounted) setBookings((data || []) as Booking[]);
            } catch (e: any) {
                if (mounted) setBookingsError(e?.message ?? 'Failed to load bookings');
            } finally {
                if (mounted) setBookingsLoading(false);
            }
        }
        loadBookings();
        return () => { mounted = false; };
    }, [supabaseUrl, supabaseAnonKey, clientId, userId, reloadBookings]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        return rows.filter((r) => {
            const statusOk = status === 'all' || (r.status ?? '').toLowerCase() === status;
            const textOk = !term || [r.id, r.origin, r.destination, r.status].some((v) => (v ?? '').toString().toLowerCase().includes(term));
            return statusOk && textOk;
        });
    }, [rows, q, status]);

    function fmtDate(d: string | null | undefined) {
        if (!d) return '—';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return (d || '').slice(0, 10);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = dt.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    }

    return (
        <>
            <main className="dashboard-container">
                <div className="dashboard-header mb-18">Welcome to RAJMOHAN TRANSPORT SERVICES</div>

                {/* KPI Row */}
                <div className={`${styles.kpiRow} mb-18`}>
                    <div className={`${styles.kpi} card`}>
                        <div className={styles.kpiTitle}>Active Shipments</div>
                        <div className={styles.kpiValue}>{rows.filter(r => (r.status ?? '').toLowerCase() === 'in_transit').length}</div>
                    </div>
                    <div className={`${styles.kpi} card`}>
                        <div className={styles.kpiTitle}>Pending Bookings</div>
                        <div className={styles.kpiValue}>{bookings.filter(b => (b.status ?? '').toLowerCase() === 'submitted').length}</div>
                    </div>
                    <div className={`${styles.kpi} card`}>
                        <div className={styles.kpiTitle}>Avg Delivery Time</div>
                        <div className={styles.kpiValue}>2h 15m</div>
                    </div>
                    <div className={`${styles.kpi} card`}>
                        <div className={styles.kpiTitle}>Revenue (Est.)</div>
                        <div className={styles.kpiValue}>₹{rows.reduce((s, r) => s + (typeof r.cost === 'number' ? r.cost : 0), 0).toLocaleString('en-IN')}</div>
                    </div>
                </div>

                <div className="grid-2-1">
                    {/* suppress hydration mismatches from password manager/browser extensions injecting attributes */}
                    <section suppressHydrationWarning>
                            <div className={`panel ${styles.panelCenter}`} id="tracking">
                            <div className="panel-title">Live Tracking</div>
                            <LeafletMap mode="client" clientId={clientId} height={250} />
                            <div className="progress">
                                <div className="fill" />
                            </div>
                            <div className="eta">ETA: 2 hrs 15 min</div>
                        </div>

                        <div className={`panel ${styles.panelCenter}`} id="shipments">
                            <div className="panel-title">Shipments</div>
                            <div className="text-primary leading-17 mb-18">Delivered or in-progress shipments created after booking approvals.</div>
                            <div className="row-gap-12">
                                <input placeholder="Filter shipments..." className="filter-input" value={q} onChange={(e) => setQ(e.target.value)} />
                                <select className="filter-input" aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="in_transit">In Transit</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>
                            {loading && <div className="muted-small">Loading…</div>}
                            {error && (
                                <div role="alert" className="muted-small">{error}</div>
                            )}
                            {!loading && !error && (
                                <div className={styles.tableWrapper}>
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
                                                <td>{fmtDate(row.created_at)}</td>
                                                <td>{typeof row.cost === 'number' ? row.cost : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            )}
                        </div>

                        <div className={`panel ${styles.panelCenter}`} id="place-order">
                            <div className="panel-title">Place Order</div>
                            <p className="text-primary leading-17">Book Truck with Details → Wait for Approval → Rate Discussion → Order Confirmation → Track Ride/Live Updates → Payment and Confirmation.</p>
                            {!showPlaceOrder && (
                                <>
                                    <button className="btn-dark" onClick={() => {
                                        if (guestMode) {
                                            setShowGuestModal(true);
                                            return;
                                        }
                                        setShowPlaceOrder(true);
                                    }}>Book Truck</button>
                                    {showGuestModal && (
                                        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Login required">
                                            <div className="modal-panel">
                                                <h3 style={{marginTop:0}}>Kindly Login or Signup to unlock this feature</h3>
                                                <div className="row-gap-12" style={{display:'flex',gap:12,marginTop:12}}>
                                                    <a className="btn-dark" href="/login">Login</a>
                                                    <a className="btn-dark" href="/register">Sign up</a>
                                                    <button className="btn-dark" onClick={() => setShowGuestModal(false)}>Close</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {showPlaceOrder && (
                                <form className={`${styles.centerForm} form-vertical`} onSubmit={async (e) => {
                                    e.preventDefault();
                                    setPlaceError(null);
                                    setPlaceSuccess(null);
                                    if (!supabaseUrl || !supabaseAnonKey) {
                                        setPlaceError('Supabase env is not configured.');
                                        return;
                                    }
                                    // Allow submission even if client_id is not set; we'll bind to user_id and let RLS policy permit it.
                                    try {
                                        setPlacing(true);
                                        const supabase = createClient();
                                        const { data: { user } } = await supabase.auth.getUser();
                                        const payload = {
                                            user_id: user?.id,
                                            client_id: clientId ?? null,
                                            source_city: form.source_city.trim(),
                                            destination_city: form.destination_city.trim(),
                                            vehicle_type: form.vehicle_type || null,
                                            material: form.material.trim() || null,
                                            weight_mt: form.weight_mt ? Number(form.weight_mt) : null,
                                            pickup_date: form.pickup_date || null,
                                            notes: form.notes.trim() || null,
                                            status: 'submitted' as const,
                                        };
                                        const { error } = await supabase.from('bookings').insert(payload);
                                        if (error) throw error;
                                        setPlaceSuccess('Booking submitted! Our team will review and confirm.');
                                        setForm({ source_city: '', destination_city: '', vehicle_type: '', material: '', weight_mt: '', pickup_date: '', notes: '' });
                                        setShowPlaceOrder(false);
                                        // Trigger a refresh of the bookings list
                                        setReloadBookings((x) => x + 1);
                                    } catch (err: any) {
                                        setPlaceError(err?.message ?? 'Failed to submit booking');
                                    } finally {
                                        setPlacing(false);
                                    }
                                }}>
                                    <input className="filter-input" placeholder="Source City" value={form.source_city} onChange={(e) => setForm({ ...form, source_city: e.target.value })} required aria-label="Source City" />
                                    <input className="filter-input" placeholder="Destination City" value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} required aria-label="Destination City" />
                                    <select className="filter-input" aria-label="Vehicle Type" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} required>
                                        <option value="">Select Vehicle Type</option>
                                        <option value="Pickup (1.5T)">Pickup (1.5T)</option>
                                        <option value="LCV (3.5T)">LCV (3.5T)</option>
                                        <option value="Truck (9T)">Truck (9T)</option>
                                        <option value="Truck (16T)">Truck (16T)</option>
                                        <option value="Trailer (25T)">Trailer (25T)</option>
                                    </select>
                                    <input className="filter-input" placeholder="Material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} aria-label="Material" />
                                    <input className="filter-input" placeholder="Weight (MT)" type="number" step="0.01" value={form.weight_mt} onChange={(e) => setForm({ ...form, weight_mt: e.target.value })} aria-label="Weight (MT)" />
                                    <input className="filter-input" placeholder="Pickup Date" type="date" value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} aria-label="Pickup Date" />
                                    <input className="filter-input" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} aria-label="Notes" />
                                    <div className="row-gap-12">
                                        <button className="btn-dark" type="submit" disabled={placing}>{placing ? 'Submitting…' : 'Submit Booking'}</button>
                                        <button className="btn-dark" type="button" onClick={() => { setShowPlaceOrder(false); setPlaceError(null); }}>Cancel</button>
                                    </div>
                                    {placeError && <div role="alert">{placeError}</div>}
                                    {placeSuccess && <div role="status">{placeSuccess}</div>}
                                </form>
                            )}
                        </div>

                        <div className={`panel ${styles.panelCenter}`} id="my-bookings">
                            <div className="panel-title">My Bookings</div>
                            <div className="text-primary leading-17 mb-18">Requests you submitted for approval. Approved bookings appear later as shipments.</div>
                            {bookingsLoading && <div>Loading…</div>}
                            {bookingsError && <div role="alert">{bookingsError}</div>}
                            {!bookingsLoading && !bookingsError && (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Source</th>
                                            <th>Destination</th>
                                            <th>Weight (MT)</th>
                                            <th>Pickup</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((b) => (
                                            <tr key={b.id}>
                                                <td>{b.id.slice(0,8)}…</td>
                                                <td>{b.source_city ?? '—'}</td>
                                                <td>{b.destination_city ?? '—'}</td>
                                                <td>{typeof b.weight_mt === 'number' ? b.weight_mt : '—'}</td>
                                                <td>{fmtDate(b.pickup_date)}</td>
                                                <td>{b.status ?? '—'}</td>
                                                <td>{fmtDate(b.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className={`panel ${styles.panelCenter} ${styles.panelMiddle}`} id="rate">
                            <div className="panel-title">Rate Calculator</div>
                            <div className={styles.rateBox}>
                                <div className={`${styles.centerCalc} calc-column`}>
                                    <select className="filter-input" aria-label="Vehicle Type for Rate" value={rateVehicle} onChange={(e) => setRateVehicle(e.target.value)}>
                                        <option value="Pickup (1.5T)">Pickup (1.5T)</option>
                                        <option value="LCV (3.5T)">LCV (3.5T)</option>
                                        <option value="Truck (9T)">Truck (9T)</option>
                                        <option value="Truck (16T)">Truck (16T)</option>
                                        <option value="Trailer (25T)">Trailer (25T)</option>
                                    </select>
                                    <input placeholder="Distance (km)" className="filter-input" value={rateDistance} onChange={(e) => setRateDistance(e.target.value)} />
                                    <input placeholder="Weight (MT)" className="filter-input" value={rateWeight} onChange={(e) => setRateWeight(e.target.value)} />
                                    <button className="btn-dark" onClick={(e) => {
                                        e.preventDefault();
                                        const distance = parseFloat(rateDistance || '0');
                                        const weight = parseFloat(rateWeight || '0');
                                        const basePerKm: Record<string, number> = {
                                            'Pickup (1.5T)': 18,
                                            'LCV (3.5T)': 24,
                                            'Truck (9T)': 32,
                                            'Truck (16T)': 38,
                                            'Trailer (25T)': 45,
                                        };
                                        const minCharge: Record<string, number> = {
                                            'Pickup (1.5T)': 1200,
                                            'LCV (3.5T)': 1600,
                                            'Truck (9T)': 2200,
                                            'Truck (16T)': 2800,
                                            'Trailer (25T)': 3600,
                                        };
                                        const perKm = basePerKm[rateVehicle] ?? 30;
                                        const min = minCharge[rateVehicle] ?? 2000;
                                        const weightFactor = Math.max(1, weight / 5);
                                        const estimate = Math.max(min, Math.round(perKm * distance * weightFactor));
                                        setRateEstimate(`₹${estimate.toLocaleString('en-IN')}`);
                                    }}>Calculate</button>
                                    <div className={`${styles.panelCenter} eta`}>Estimated Price: {rateEstimate}</div>
                                    <div className="text-muted">Note: Rates shown are indicative and may vary with real conditions (traffic, tolls, loading, waiting).</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="col-gap-32">
                        <div className={`panel ${styles.panelCenter}`} id="notifications">
                            <div className="panel-title">Notifications</div>
                            <ul>
                                <li>Shipment #1002 is in transit.</li>
                                <li>Payment pending for shipment #1003.</li>
                                <li>Support ticket #202 resolved.</li>
                            </ul>
                        </div>
                        <div className={`panel ${styles.panelCenter}`} id="documents">
                            <div className="panel-title">Document Center</div>
                            <ul>
                                <li>Waybill</li>
                                <li>Invoice</li>
                                <li>PoD</li>
                                <li>Compliance</li>
                            </ul>
                        </div>
                    <div className={`panel ${styles.panelCenter}`} id="aboutus">
                <div className="panel-title">About Us</div>
                    <div className="text-primary text-1rem leading-17"><strong>Rajmohan Transport Services</strong> provides reliable, efficient, and safe transportation solutions. Real-time tracking, easy booking, and dedicated support.</div>
            </div>
                        <div className={`panel ${styles.panelCenter}`} id="support">
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
