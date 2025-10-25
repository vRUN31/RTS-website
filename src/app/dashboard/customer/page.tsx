"use client";
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';
import EnhancedBookingForm from '@/src/components/booking/EnhancedBookingForm';

const LeafletMap = dynamic(() => import('@/src/components/map/LeafletMap.client'), { ssr: false });
const TrucksShowcase = dynamic(() => import('@/src/components/guest/TrucksShowcase.client'), { ssr: false });
const InstagramChat = dynamic(() => import('@/src/components/chat/InstagramChat.client'), { ssr: false });
const ChatNotificationBadge = dynamic(() => import('@/src/components/chat/ChatNotificationBadge.client'), { ssr: false });
const IssueReportForm = dynamic(() => import('@/src/components/issues/IssueReportForm.client'), { ssr: false });

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

type Notification = {
    id: string;
    type: string;
    payload: { message: string; bookingId?: string };
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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [selectedShipmentForDocs, setSelectedShipmentForDocs] = useState<string | null>(null);
    const [form, setForm] = useState({
        source_city: '',
        destination_city: '',
        vehicle_type: '',
        material: '',
        weight_mt: '',
        pickup_date: '',
        notes: '',
    });
    // Route data from map (distance in km, duration in seconds)
    const [routeDistance, setRouteDistance] = useState<number>(0);
    const [routeDuration, setRouteDuration] = useState<number>(0);
    // Rate calculator state
    const [rateVehicle, setRateVehicle] = useState('Pickup (1.5T)');
    const [rateDistance, setRateDistance] = useState('');
    const [rateWeight, setRateWeight] = useState('');
    const [rateEstimate, setRateEstimate] = useState<string>('—');
    // Dark mode state
    const [isDarkMode, setIsDarkMode] = useState(false);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Initialize dark mode from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    useEffect(() => {
        let mounted = true;
        const supabase = createClient();
        
        async function load() {
            setError(null);
            setLoading(true);
            try {
                if (!supabaseUrl || !supabaseAnonKey) {
                    if (mounted) setRows([]);
                } else {
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
                    
                    // Set up real-time subscription for shipments updates
                    if (clientId) {
                        console.log('🚚 Setting up real-time shipments subscription for client:', clientId);
                        const channel = supabase
                            .channel('shipments_realtime')
                            .on(
                                'postgres_changes',
                                {
                                    event: 'UPDATE',
                                    schema: 'public',
                                    table: 'shipments',
                                    filter: `client_id=eq.${clientId}`,
                                },
                                (payload) => {
                                    console.log('✅ Shipment updated:', payload);
                                    if (mounted && payload.new) {
                                        setRows((prev) => {
                                            const updated = payload.new as Shipment;
                                            const index = prev.findIndex(s => s.id === updated.id);
                                            if (index >= 0) {
                                                // Update existing shipment
                                                const newRows = [...prev];
                                                newRows[index] = updated;
                                                console.log('📦 Shipment updated in list:', updated.id, 'Status:', updated.status);
                                                return newRows;
                                            } else {
                                                // Add new shipment if not found
                                                console.log('📦 New shipment added to list:', updated.id);
                                                return [updated, ...prev];
                                            }
                                        });
                                    }
                                }
                            )
                            .on(
                                'postgres_changes',
                                {
                                    event: 'INSERT',
                                    schema: 'public',
                                    table: 'shipments',
                                    filter: `client_id=eq.${clientId}`,
                                },
                                (payload) => {
                                    console.log('✅ New shipment inserted:', payload);
                                    if (mounted && payload.new) {
                                        const newShipment = payload.new as Shipment;
                                        setRows((prev) => [newShipment, ...prev]);
                                        console.log('📦 New shipment added to list:', newShipment.id);
                                    }
                                }
                            )
                            .subscribe((status, err) => {
                                console.log('📡 Shipments subscription status:', status);
                                if (err) {
                                    console.error('❌ Shipments subscription error:', err);
                                }
                            });
                        
                        return () => {
                            mounted = false;
                            supabase.removeChannel(channel);
                        };
                    }
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

    // Load bookings for this user/client with real-time updates
    useEffect(() => {
        let mounted = true;
        const supabase = createClient();
        
        async function loadBookings() {
            setBookingsError(null);
            try {
                if (!supabaseUrl || !supabaseAnonKey) {
                    if (mounted) setBookings([]);
                    return;
                }
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
                
                // Set up real-time subscription for bookings updates
                if (clientId || userId) {
                    console.log('🔔 Setting up real-time bookings subscription for:', clientId ? `client: ${clientId}` : `user: ${userId}`);
                    const filter = clientId ? `client_id=eq.${clientId}` : `user_id=eq.${userId}`;
                    const channel = supabase
                        .channel('bookings_realtime')
                        .on(
                            'postgres_changes',
                            {
                                event: 'UPDATE',
                                schema: 'public',
                                table: 'bookings',
                                filter: filter,
                            },
                            (payload) => {
                                console.log('✅ Booking updated:', payload);
                                if (mounted && payload.new) {
                                    setBookings((prev) => {
                                        const updated = payload.new as Booking;
                                        const index = prev.findIndex(b => b.id === updated.id);
                                        if (index >= 0) {
                                            const newBookings = [...prev];
                                            newBookings[index] = updated;
                                            console.log('📋 Booking status updated:', updated.id, '→', updated.status);
                                            return newBookings;
                                        } else {
                                            return [updated, ...prev];
                                        }
                                    });
                                }
                            }
                        )
                        .on(
                            'postgres_changes',
                            {
                                event: 'INSERT',
                                schema: 'public',
                                table: 'bookings',
                                filter: filter,
                            },
                            (payload) => {
                                console.log('✅ New booking inserted:', payload);
                                if (mounted && payload.new) {
                                    const newBooking = payload.new as Booking;
                                    setBookings((prev) => [newBooking, ...prev]);
                                    console.log('📋 New booking added:', newBooking.id);
                                }
                            }
                        )
                        .subscribe((status, err) => {
                            console.log('📡 Bookings subscription status:', status);
                            if (err) {
                                console.error('❌ Bookings subscription error:', err);
                            }
                        });
                    
                    return () => {
                        mounted = false;
                        supabase.removeChannel(channel);
                    };
                }
            } catch (e: any) {
                if (mounted) setBookingsError(e?.message ?? 'Failed to load bookings');
            } finally {
                if (mounted) setBookingsLoading(false);
            }
        }
        
        loadBookings();
        return () => { mounted = false; };
    }, [supabaseUrl, supabaseAnonKey, clientId, userId, reloadBookings]);

    // Load notifications for this user with real-time updates
    useEffect(() => {
        let mounted = true;
        const supabase = createClient();
        
        async function loadNotifications() {
            if (!userId || !supabaseUrl || !supabaseAnonKey) {
                if (mounted) setNotifications([]);
                return;
            }
            setNotificationsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('id, type, payload, created_at')
                    .eq('user_id', userId)
                    .eq('channel', 'inapp')
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (error) throw error;
                if (mounted) setNotifications((data || []) as Notification[]);
            } catch (e: any) {
                console.error('Failed to load notifications', e);
                if (mounted) setNotifications([]);
            } finally {
                if (mounted) setNotificationsLoading(false);
            }
        }
        
        loadNotifications();
        
        // Subscribe to real-time notifications
        if (userId && supabaseUrl && supabaseAnonKey) {
            console.log('🔔 Setting up real-time notifications subscription for user:', userId);
            const channel = supabase
                .channel('notifications_realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        console.log('✅ New notification received:', payload);
                        if (mounted && payload.new) {
                            setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 9)]);
                            // Show a brief alert or toast (optional)
                            console.log('📬 Notification added to list');
                        }
                    }
                )
                .subscribe((status, err) => {
                    console.log('📡 Subscription status:', status);
                    if (err) {
                        console.error('❌ Subscription error:', err);
                    }
                });
                
            return () => {
                mounted = false;
                supabase.removeChannel(channel);
            };
        }
        
        return () => { mounted = false; };
    }, [supabaseUrl, supabaseAnonKey, userId]);

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

    function getStatusBadgeClass(status: string | null) {
        if (!status) return styles.statusBadge;
        const statusLower = status.toLowerCase();
        if (statusLower === 'pending') return `${styles.statusBadge} ${styles.statusPending}`;
        if (statusLower === 'in_transit') return `${styles.statusBadge} ${styles.statusInTransit}`;
        if (statusLower === 'delivered') return `${styles.statusBadge} ${styles.statusDelivered}`;
        if (statusLower === 'rejected') return `${styles.statusBadge} ${styles.statusRejected}`;
        if (statusLower === 'submitted') return `${styles.statusBadge} ${styles.statusSubmitted}`;
        if (statusLower === 'approved') return `${styles.statusBadge} ${styles.statusInTransit}`; // Use same style as in_transit
        if (statusLower === 'cancelled') return `${styles.statusBadge} ${styles.statusRejected}`; // Use same style as rejected
        return styles.statusBadge;
    }

    function formatStatus(status: string | null) {
        if (!status) return '—';
        // Format status for display
        const formatted = status.replace(/_/g, ' ');
        // Capitalize first letter of each word
        return formatted.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    return (
        <>
            <main className="dashboard-container">
                <div className={`dashboard-header mb-18 ${styles.gradientText}`}>Welcome to RAJMOHAN TRANSPORT SERVICES</div>

                {/* KPI Row - Hidden for guest users */}
                {!guestMode && (
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
                )}

                <div className="grid-2-1">
                    {/* suppress hydration mismatches from password manager/browser extensions injecting attributes */}
                    <section suppressHydrationWarning>
                        <div className={`panel ${styles.panelCenter} ${guestMode ? '' : styles.particleBackground}`} id="tracking">
                            <div className="panel-title">{guestMode ? '🚛 Our Fleet' : 'Live Tracking'}</div>
                            {guestMode ? (
                                <TrucksShowcase />
                            ) : (
                                <>
                                    <LeafletMap mode="client" clientId={clientId} height={250} />
                                    <div className="progress">
                                        <div className="fill" />
                                    </div>
                                    <div className="eta">ETA: 2 hrs 15 min</div>
                                </>
                            )}
                        </div>

                        <div className={`panel ${styles.panelCenter} ${styles.shineEffect}`} id="place-order">
                            <div className="panel-title">Place Order</div>
                            <p className="text-primary leading-17">Book Truck with Details → Wait for Approval → Rate Discussion → Order Confirmation → Track Ride/Live Updates → Payment and Confirmation.</p>
                            {!showPlaceOrder && (
                                <>
                                    <button className={`btn-dark ${styles.enhancedButton}`} onClick={() => {
                                        if (guestMode) {
                                            setShowGuestModal(true);
                                            return;
                                        }
                                        setShowPlaceOrder(true);
                                    }}>📦 Book Truck</button>
                                    {showGuestModal && (
                                        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Login required" style={{ animation: 'fadeIn 0.3s ease' }}>
                                            <div className="modal-panel" style={{ animation: 'slideIn 0.3s ease' }}>
                                                <h3 style={{marginTop:0}}>🔒 Kindly Login or Signup to unlock this feature</h3>
                                                <p style={{ color: '#64748b', marginBottom: '20px' }}>You need to be logged in to book trucks and track shipments.</p>
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
                                    // Validate that source and destination are provided
                                    if (!form.source_city || !form.destination_city) {
                                        setPlaceError('Please enter both source and destination cities.');
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
                                            // Include route data from map if available
                                            estimated_distance: routeDistance > 0 ? routeDistance : null,
                                            estimated_duration: routeDuration > 0 ? routeDuration : null,
                                        };
                                        const { error } = await supabase.from('bookings').insert(payload);
                                        if (error) throw error;
                                        setPlaceSuccess('Booking submitted! Our team will review and confirm.');
                                        setForm({ source_city: '', destination_city: '', vehicle_type: '', material: '', weight_mt: '', pickup_date: '', notes: '' });
                                        // Clear route data
                                        setRouteDistance(0);
                                        setRouteDuration(0);
                                        setShowPlaceOrder(false);
                                        // Trigger a refresh of the bookings list
                                        setReloadBookings((x) => x + 1);
                                    } catch (err: any) {
                                        setPlaceError(err?.message ?? 'Failed to submit booking');
                                    } finally {
                                        setPlacing(false);
                                    }
                                }}>
                                    {/* Enhanced Booking Form with Optional Map */}
                                    <EnhancedBookingForm
                                        form={form}
                                        setForm={setForm}
                                        placing={placing}
                                        placeError={placeError}
                                        placeSuccess={placeSuccess}
                                        onCancel={() => { setShowPlaceOrder(false); setPlaceError(null); }}
                                        onRouteCalculated={(distance, duration) => {
                                            setRouteDistance(distance);
                                            setRouteDuration(duration);
                                        }}
                                    />
                                </form>
                            )}
                        </div>

                        {/* Hide My Bookings section for guest users */}
                        {!guestMode && (
                            <div className={`panel ${styles.panelCenter}`} id="my-bookings">
                                <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>My Bookings</span>
                                    <a 
                                        href="/bookings" 
                                        style={{ 
                                            fontSize: '14px', 
                                            fontWeight: 600, 
                                            color: 'var(--brand)', 
                                            textDecoration: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            background: 'rgba(255, 77, 0, 0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 77, 0, 0.2)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 77, 0, 0.1)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        View All →
                                    </a>
                                </div>
                                <div className="text-primary leading-17 mb-18">Requests you submitted for approval. Approved bookings appear later as shipments.</div>
                                {bookingsLoading && <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <div className={styles.loadingSpinner} style={{ margin: '0 auto 10px' }}></div>
                                    <div>Loading bookings...</div>
                                </div>}
                                {bookingsError && <div role="alert" className={styles.errorMessage}>{bookingsError}</div>}
                                {!bookingsLoading && !bookingsError && bookings.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <h3>No Bookings Yet</h3>
                                        <p>Submit a booking request to get started!</p>
                                    </div>
                                )}
                                {!bookingsLoading && !bookingsError && bookings.length > 0 && (
                                    <div className={styles.tableWrapper}>
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
                                                <tr key={b.id} className={styles.hoverCard} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{b.id.slice(0,8)}…</td>
                                                    <td>{b.source_city ?? '—'}</td>
                                                    <td>{b.destination_city ?? '—'}</td>
                                                    <td>{typeof b.weight_mt === 'number' ? b.weight_mt : '—'}</td>
                                                    <td>{fmtDate(b.pickup_date)}</td>
                                                    <td>
                                                        <span className={getStatusBadgeClass(b.status)}>
                                                            {formatStatus(b.status)}
                                                        </span>
                                                    </td>
                                                    <td>{fmtDate(b.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                )}
                            </div>
                        )}

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
                                    <button className={`btn-dark ${styles.enhancedButton}`} onClick={(e) => {
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
                                    }}>💰 Calculate</button>
                                    <div className={`${styles.panelCenter} eta`}>Estimated Price: {rateEstimate}</div>
                                    <div className="text-muted" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                                        📌 Note: Rates shown are indicative and may vary with real conditions (traffic, tolls, loading, waiting).
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="col-gap-32">
                        <div className={`panel ${styles.panelCenter}`} id="notifications">
                            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔔 Notifications
                                {!notificationsLoading && notifications.length > 0 && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #ff4d00 0%, #ff6f00 100%)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        minWidth: '20px',
                                        textAlign: 'center'
                                    }}>
                                        {notifications.length}
                                    </span>
                                )}
                            </div>
                            {notificationsLoading && <div style={{ padding: '20px' }}>
                                <div className={styles.loadingSpinner} style={{ margin: '0 auto' }}></div>
                            </div>}
                            {!notificationsLoading && notifications.length === 0 && (
                                <div className={styles.emptyState}>
                                    <p>No new notifications.</p>
                                </div>
                            )}
                            {!notificationsLoading && notifications.length > 0 && (
                                <>
                                    <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
                                        {notifications.slice(0, 3).map((n) => {
                                            const notifType = n.type || 'system';
                                            const icon = notifType === 'dispatch' ? '🚚' : 
                                                         notifType === 'system' ? '🔔' : 
                                                         notifType.includes('reject') ? '❌' : 
                                                         notifType.includes('trip_start') ? '�' :
                                                         notifType.includes('trip_end') ? '🏁' : '�📬';
                                            const timeAgo = (() => {
                                                const diff = Date.now() - new Date(n.created_at).getTime();
                                                const mins = Math.floor(diff / 60000);
                                                const hours = Math.floor(diff / 3600000);
                                                const days = Math.floor(diff / 86400000);
                                                if (days > 0) return `${days}d ago`;
                                                if (hours > 0) return `${hours}h ago`;
                                                if (mins > 0) return `${mins}m ago`;
                                                return 'Just now';
                                            })();
                                            
                                            return (
                                                <li 
                                                    key={n.id} 
                                                    className={styles.notificationItem}
                                                    style={{ 
                                                        borderLeft: `3px solid ${notifType.includes('reject') ? '#ef4444' : 'var(--brand)'}`
                                                    }}
                                                >
                                                    <span className={styles.notificationIcon}>{icon}</span>
                                                    <div className={styles.notificationContent}>
                                                        <div className={styles.notificationMessage}>{n.payload.message}</div>
                                                        <div className={styles.notificationTime}>{timeAgo}</div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {notifications.length > 3 && (
                                        <div style={{ 
                                            textAlign: 'center', 
                                            padding: '12px 0 8px 0',
                                            borderTop: '1px solid #e2e8f0'
                                        }}>
                                            <button
                                                onClick={() => setShowAllNotifications(true)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--brand)',
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    padding: '4px 8px'
                                                }}
                                            >
                                                Show all notifications ({notifications.length})
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className={`panel ${styles.panelCenter}`} id="documents">
                            <div className="panel-title">📄 Document Center</div>
                            {guestMode ? (
                                <div className={styles.emptyState}>
                                    <h3>🔒 Login Required</h3>
                                    <p>Please login to access shipment documents</p>
                                    <div className="row-gap-12" style={{display:'flex',gap:12,marginTop:16,justifyContent:'center'}}>
                                        <a className={`btn-dark ${styles.enhancedButton}`} href="/login">Login</a>
                                        <a className={`btn-dark ${styles.enhancedButton}`} href="/register">Sign Up</a>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p style={{ 
                                        fontSize: '0.875rem', 
                                        color: 'var(--text-secondary)', 
                                        marginBottom: '16px',
                                        textAlign: 'center' 
                                    }}>
                                        Access shipment documents by selecting a shipment below
                                    </p>
                                    
                                    {loading ? (
                                        <div style={{ padding: '20px', textAlign: 'center' }}>
                                            <div className={styles.loadingSpinner} style={{ margin: '0 auto' }}></div>
                                        </div>
                                    ) : rows.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <p>No shipments found. Documents will appear here once you have active shipments.</p>
                                        </div>
                                    ) : (
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {rows.slice(0, 5).map((shipment) => {
                                                const isDelivered = shipment.status?.toLowerCase() === 'delivered';
                                                const docsAvailable = isDelivered ? 4 : 3; // All 4 docs if delivered, else 3
                                                
                                                return (
                                                    <button
                                                        key={shipment.id}
                                                        onClick={() => {
                                                            setSelectedShipmentForDocs(shipment.id);
                                                            setShowDocuments(true);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                                            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 77, 0, 0.05)';
                                                            e.currentTarget.style.borderColor = 'var(--brand)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
                                                            e.currentTarget.style.borderColor = isDarkMode ? '#334155' : '#e2e8f0';
                                                        }}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ 
                                                                fontSize: '0.813rem', 
                                                                fontWeight: 600,
                                                                color: 'var(--text)',
                                                                marginBottom: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}>
                                                                {shipment.origin} → {shipment.destination}
                                                                <span style={{
                                                                    fontSize: '0.688rem',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    background: isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                                    color: isDelivered ? '#10b981' : '#3b82f6',
                                                                    fontWeight: 700
                                                                }}>
                                                                    {docsAvailable}/4 docs
                                                                </span>
                                                            </div>
                                                            <div style={{ 
                                                                fontSize: '0.75rem', 
                                                                color: 'var(--text-secondary)' 
                                                            }}>
                                                                ID: {String(shipment.id).slice(0, 8)}... • {shipment.status}
                                                            </div>
                                                        </div>
                                                        <span style={{ color: 'var(--brand)', fontSize: '1.25rem' }}>→</span>
                                                    </button>
                                                );
                                            })}
                                            {rows.length > 5 && (
                                                <div style={{ 
                                                    textAlign: 'center', 
                                                    padding: '8px 0',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    Showing 5 of {rows.length} shipments
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    <div className={`panel ${styles.panelCenter}`} id="aboutus">
                <div className="panel-title">ℹ️ About Us</div>
                    <div className="text-primary text-1rem leading-17" style={{ textAlign: 'center' }}>
                        <strong>Rajmohan Transport Services</strong> provides reliable, efficient, and safe transportation solutions. Real-time tracking, easy booking, and dedicated support.
                    </div>
            </div>
                        <div className={`panel ${styles.panelCenter}`} id="support">
                            <div className="panel-title">💬 Support Chat</div>
                            {guestMode ? (
                                <div className={styles.emptyState}>
                                    <h3>🔒 Login Required</h3>
                                    <p>Please login to access live support chat</p>
                                    <div className="row-gap-12" style={{display:'flex',gap:12,marginTop:16,justifyContent:'center'}}>
                                        <a className={`btn-dark ${styles.enhancedButton}`} href="/login">Login</a>
                                        <a className={`btn-dark ${styles.enhancedButton}`} href="/register">Sign Up</a>
                                    </div>
                                </div>
                            ) : !showChat ? (
                                <div style={{ textAlign: 'center' }}>
                                    <p className="text-primary" style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                                        Chat directly with our support team. Get instant help with your shipments, bookings, and any questions you have.
                                    </p>
                                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                        <button 
                                            className={`btn-dark ${styles.enhancedButton}`}
                                            onClick={() => setShowChat(true)}
                                            style={{ width: '100%' }}
                                        >
                                            💬 Start Chat
                                        </button>
                                        {userId && (
                                            <ChatNotificationBadge
                                                userId={userId}
                                                userRole="client"
                                            />
                                        )}
                                    </div>
                                    <div className="row-gap-24" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '16px' }}>
                                        <button 
                                            className={`btn-dark ${styles.enhancedButton}`}
                                            onClick={() => setShowIssueForm(true)}
                                        >
                                            ⚠️ Report Issue
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ width: '100%', marginTop: '16px' }}>
                                    {userId && (
                                        <InstagramChat
                                            userId={userId}
                                            userRole="client"
                                            userName="Admin Support"
                                        />
                                    )}
                                    <button
                                        className="btn-dark"
                                        onClick={() => setShowChat(false)}
                                        style={{ width: '100%', marginTop: '16px' }}
                                    >
                                        ✕ Close Chat
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className={`panel ${styles.panelCenter}`} id="faq">
                            <div className="panel-title">❓ FAQ</div>
                            <div style={{ width: '100%', textAlign: 'left' }}>
                                <details style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255, 77, 0, 0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: '600', color: 'var(--brand)' }}>How do I track my shipment?</summary>
                                    <p style={{ marginTop: '8px', fontSize: '0.938rem', color: 'var(--text)' }}>
                                        Use the Live Tracking section above to see real-time location of your shipment on the map.
                                    </p>
                                </details>
                                <details style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255, 77, 0, 0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: '600', color: 'var(--brand)' }}>What are the payment options?</summary>
                                    <p style={{ marginTop: '8px', fontSize: '0.938rem', color: 'var(--text)' }}>
                                        We accept UPI, credit/debit cards, net banking, and cash on delivery for verified customers.
                                    </p>
                                </details>
                                <details style={{ marginBottom: '12px', padding: '12px', background: 'rgba(255, 77, 0, 0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                                    <summary style={{ fontWeight: '600', color: 'var(--brand)' }}>How long does approval take?</summary>
                                    <p style={{ marginTop: '8px', fontSize: '0.938rem', color: 'var(--text)' }}>
                                        Booking requests are typically reviewed within 2-4 hours during business hours.
                                    </p>
                                </details>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Help Resources - Full Width Section */}
                <div className={`panel ${styles.panelCenter}`} id="help-resources" style={{ marginTop: '24px' }}>
                    <div className="panel-title">📚 Help Resources</div>
                    <div style={{ 
                        width: '100%', 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '16px',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        <a href="/user-guide" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px', 
                            padding: '20px 16px', 
                            background: 'rgba(255, 77, 0, 0.05)', 
                            borderRadius: '12px', 
                            textDecoration: 'none', 
                            color: 'var(--text)', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontWeight: 500,
                            fontSize: '1rem',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                           onMouseEnter={(e) => {
                               e.currentTarget.style.background = 'rgba(255, 77, 0, 0.1)';
                               e.currentTarget.style.transform = 'translateY(-4px)';
                               e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 77, 0, 0.2)';
                           }}
                           onMouseLeave={(e) => {
                               e.currentTarget.style.background = 'rgba(255, 77, 0, 0.05)';
                               e.currentTarget.style.transform = 'translateY(0)';
                               e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                           }}>
                            📖 <span>User Guide</span>
                        </a>
                        <button 
                            onClick={() => setShowChat(true)}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px', 
                                padding: '20px 16px', 
                                background: 'rgba(255, 77, 0, 0.05)', 
                                borderRadius: '12px', 
                                border: 'none',
                                color: 'var(--text)', 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                width: '100%',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                fontWeight: 500,
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 77, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 77, 0, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 77, 0, 0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            📞 <span>Contact Support</span>
                        </button>
                        <a href="mailto:support@rajmohantransport.com" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px', 
                            padding: '20px 16px', 
                            background: 'rgba(255, 77, 0, 0.05)', 
                            borderRadius: '12px', 
                            textDecoration: 'none', 
                            color: 'var(--text)', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontWeight: 500,
                            fontSize: '1rem',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                           onMouseEnter={(e) => {
                               e.currentTarget.style.background = 'rgba(255, 77, 0, 0.1)';
                               e.currentTarget.style.transform = 'translateY(-4px)';
                               e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 77, 0, 0.2)';
                           }}
                           onMouseLeave={(e) => {
                               e.currentTarget.style.background = 'rgba(255, 77, 0, 0.05)';
                               e.currentTarget.style.transform = 'translateY(0)';
                               e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                           }}>
                            📧 <span>Email Us</span>
                        </a>
                    </div>
                </div>
            </main>
            
            {/* Theme Toggle Button */}
            <button 
                className={styles.themeToggle}
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            {/* Issue Report Modal */}
            {showIssueForm && userId && (
                <IssueReportForm
                    userId={userId}
                    onClose={() => setShowIssueForm(false)}
                    onSuccess={() => {
                        // Optionally refresh notifications or show a success message
                        console.log('Issue reported successfully');
                    }}
                />
            )}
            
            {/* All Notifications Modal */}
            {showAllNotifications && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={() => setShowAllNotifications(false)}
                >
                    <div 
                        style={{
                            background: isDarkMode ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: '1.5rem',
                                color: isDarkMode ? '#f1f5f9' : '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                🔔 All Notifications
                                <span style={{
                                    background: 'var(--brand)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    minWidth: '20px'
                                }}>
                                    {notifications.length}
                                </span>
                            </h2>
                            <button
                                onClick={() => setShowAllNotifications(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                    padding: '4px',
                                    lineHeight: 1
                                }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div style={{
                            overflowY: 'auto',
                            padding: '10px',
                            flex: 1
                        }}>
                            {notificationsLoading && (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <div className={styles.loadingSpinner} style={{ margin: '0 auto' }}></div>
                                </div>
                            )}
                            
                            {!notificationsLoading && notifications.length === 0 && (
                                <div className={styles.emptyState} style={{ padding: '40px' }}>
                                    <p>No notifications yet.</p>
                                </div>
                            )}
                            
                            {!notificationsLoading && notifications.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {notifications.map((n) => {
                                        const notifType = n.type || 'system';
                                        const icon = notifType === 'dispatch' ? '🚚' : 
                                                     notifType === 'system' ? '🔔' : 
                                                     notifType.includes('reject') ? '❌' : 
                                                     notifType.includes('trip_start') ? '🚀' :
                                                     notifType.includes('trip_end') ? '🏁' : '📬';
                                        const timeAgo = (() => {
                                            const diff = Date.now() - new Date(n.created_at).getTime();
                                            const mins = Math.floor(diff / 60000);
                                            const hours = Math.floor(diff / 3600000);
                                            const days = Math.floor(diff / 86400000);
                                            if (days > 0) return `${days}d ago`;
                                            if (hours > 0) return `${hours}h ago`;
                                            if (mins > 0) return `${mins}m ago`;
                                            return 'Just now';
                                        })();
                                        
                                        return (
                                            <li 
                                                key={n.id} 
                                                className={styles.notificationItem}
                                                style={{ 
                                                    borderLeft: `3px solid ${notifType.includes('reject') ? '#ef4444' : 'var(--brand)'}`
                                                }}
                                            >
                                                <span className={styles.notificationIcon}>{icon}</span>
                                                <div className={styles.notificationContent}>
                                                    <div className={styles.notificationMessage}>{n.payload.message}</div>
                                                    <div className={styles.notificationTime}>{timeAgo}</div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        
                        {/* Modal Footer */}
                        <div style={{
                            padding: '15px 20px',
                            borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                            textAlign: 'right'
                        }}>
                            <button
                                onClick={() => setShowAllNotifications(false)}
                                style={{
                                    background: 'var(--brand)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Documents Modal */}
            {showDocuments && selectedShipmentForDocs && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={() => {
                        setShowDocuments(false);
                        setSelectedShipmentForDocs(null);
                    }}
                >
                    <div 
                        style={{
                            background: isDarkMode ? '#1e293b' : 'white',
                            borderRadius: '12px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: '1.5rem',
                                color: isDarkMode ? '#f1f5f9' : '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📄 Shipment Documents
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDocuments(false);
                                    setSelectedShipmentForDocs(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: isDarkMode ? '#94a3b8' : '#64748b',
                                    padding: '4px',
                                    lineHeight: 1
                                }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div style={{
                            padding: '20px',
                            flex: 1,
                            overflowY: 'auto'
                        }}>
                            {(() => {
                                const shipment = rows.find(r => r.id === selectedShipmentForDocs);
                                if (!shipment) return null;
                                
                                return (
                                    <>
                                        <div style={{ 
                                            marginBottom: '20px',
                                            padding: '16px',
                                            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                            borderRadius: '8px',
                                            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
                                        }}>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                Shipment ID: {String(shipment.id).slice(0, 8)}...
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
                                                {shipment.origin} → {shipment.destination}
                                            </div>
                                            <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                Status: <span style={{ 
                                                    color: shipment.status === 'delivered' ? '#10b981' : 
                                                           shipment.status === 'in_transit' ? '#3b82f6' : '#f59e0b',
                                                    fontWeight: 600 
                                                }}>{shipment.status}</span>
                                            </div>
                                        </div>
                                        
                                        <h3 style={{ 
                                            fontSize: '1rem', 
                                            fontWeight: 600,
                                            marginBottom: '16px',
                                            color: 'var(--text)'
                                        }}>
                                            Available Documents
                                        </h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {/* Waybill */}
                                            <div style={{
                                                padding: '16px',
                                                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '2rem' }}>📋</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.938rem' }}>
                                                            Waybill
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            Shipping manifest and details
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        alert('Waybill download will be implemented with backend integration');
                                                    }}
                                                    style={{
                                                        background: 'var(--brand)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.813rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    📥 Download
                                                </button>
                                            </div>
                                            
                                            {/* Invoice */}
                                            <div style={{
                                                padding: '16px',
                                                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '2rem' }}>🧾</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.938rem' }}>
                                                            Invoice
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            Payment details and breakdown
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        alert('Invoice download will be implemented with backend integration');
                                                    }}
                                                    style={{
                                                        background: 'var(--brand)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.813rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    📥 Download
                                                </button>
                                            </div>
                                            
                                            {/* Proof of Delivery - Only for delivered shipments */}
                                            {shipment.status === 'delivered' && (
                                                <div style={{
                                                    padding: '16px',
                                                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ fontSize: '2rem' }}>✅</span>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.938rem' }}>
                                                                Proof of Delivery (PoD)
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                Delivery confirmation and signature
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            alert('PoD download will be implemented with backend integration');
                                                        }}
                                                        style={{
                                                            background: 'var(--brand)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.813rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        📥 Download
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {/* Compliance Documents */}
                                            <div style={{
                                                padding: '16px',
                                                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '2rem' }}>📊</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.938rem' }}>
                                                            Compliance Documents
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            Permits, certificates, and licenses
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        alert('Compliance documents download will be implemented with backend integration');
                                                    }}
                                                    style={{
                                                        background: 'var(--brand)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.813rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    📥 Download
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {shipment.status !== 'delivered' && (
                                            <div style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                borderRadius: '8px',
                                                fontSize: '0.813rem',
                                                color: '#3b82f6'
                                            }}>
                                                ℹ️ Proof of Delivery (PoD) will be available after shipment is delivered
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        
                        {/* Modal Footer */}
                        <div style={{
                            padding: '15px 20px',
                            borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                💡 Documents are generated automatically
                            </div>
                            <button
                                onClick={() => {
                                    setShowDocuments(false);
                                    setSelectedShipmentForDocs(null);
                                }}
                                style={{
                                    background: 'var(--brand)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
