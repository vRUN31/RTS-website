"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import './bookings.css';

type Booking = {
    id: string;
    user_id: string;
    client_id: string | null;
    vehicle_type: string | null;
    source_city: string;
    destination_city: string;
    material: string | null;
    weight_mt: number | null;
    pickup_date: string | null;
    notes: string | null;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'in_transit' | 'delivered';
    created_at: string;
};

type BookingWithShipment = Booking & {
    shipment_id?: string;
    truck_plate?: string;
    current_location?: string;
    eta?: string;
    delivered_at?: string;
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingWithShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'past'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingWithShipment | null>(null);
    
    const supabase = createClient();
    const router = useRouter();

    // Initialize dark mode
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

    // Check authentication and get user
    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            setUserId(user.id);

            // Get user profile to find client_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('client_id, role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'client') {
                router.push('/admin');
                return;
            }

            setClientId(profile.client_id);
        }

        checkAuth();
    }, [supabase, router]);

    // Load bookings
    const loadBookings = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch bookings for the current user
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (bookingsError) throw bookingsError;

            // For approved bookings, try to fetch associated shipment data
            const enrichedBookings: BookingWithShipment[] = await Promise.all(
                (bookingsData || []).map(async (booking) => {
                    if (booking.status === 'approved' || booking.status === 'in_transit' || booking.status === 'delivered') {
                        // Try to find associated shipment
                        const { data: shipment } = await supabase
                            .from('shipments')
                            .select('id, truck_id, status, eta, delivered_at')
                            .eq('client_id', clientId || booking.client_id)
                            .gte('created_at', booking.created_at)
                            .order('created_at', { ascending: true })
                            .limit(1)
                            .maybeSingle();

                        if (shipment) {
                            // Get truck details
                            const { data: truck } = await supabase
                                .from('trucks')
                                .select('plate, location')
                                .eq('id', shipment.truck_id)
                                .maybeSingle();

                            return {
                                ...booking,
                                shipment_id: shipment.id,
                                truck_plate: truck?.plate,
                                current_location: truck?.location,
                                eta: shipment.eta,
                                delivered_at: shipment.delivered_at,
                            };
                        }
                    }

                    return booking;
                })
            );

            setBookings(enrichedBookings);
        } catch (err: any) {
            console.error('Failed to load bookings:', err);
            setError(err.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    }, [userId, clientId, supabase]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    // Subscribe to booking updates
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel('bookings-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    loadBookings();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase, loadBookings]);

    // Filter bookings
    const filteredBookings = bookings.filter((booking) => {
        // Status filter
        if (filterStatus === 'active' && !['submitted', 'approved', 'in_transit'].includes(booking.status)) {
            return false;
        }
        if (filterStatus === 'past' && !['delivered', 'rejected'].includes(booking.status)) {
            return false;
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                booking.source_city.toLowerCase().includes(query) ||
                booking.destination_city.toLowerCase().includes(query) ||
                booking.material?.toLowerCase().includes(query) ||
                booking.truck_plate?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Get status badge class
    const getStatusClass = (status: string) => {
        const statusMap: Record<string, string> = {
            draft: 'status-draft',
            submitted: 'status-submitted',
            approved: 'status-approved',
            rejected: 'status-rejected',
            in_transit: 'status-in-transit',
            delivered: 'status-delivered',
        };
        return statusMap[status] || '';
    };

    // Get status label
    const getStatusLabel = (status: string) => {
        const labelMap: Record<string, string> = {
            draft: 'Draft',
            submitted: 'Pending Review',
            approved: 'Approved',
            rejected: 'Rejected',
            in_transit: 'In Transit',
            delivered: 'Delivered',
        };
        return labelMap[status] || status;
    };

    if (loading) {
        return (
            <div className="bookings-page">
                <div className="bookings-loading">
                    <div className="spinner" />
                    <p>Loading your bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bookings-page">
            {/* Header */}
            <header className="bookings-header">
                <div className="header-content">
                    <div className="header-left">
                        <button 
                            className="back-btn"
                            onClick={() => router.push('/dashboard/customer')}
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="page-title">My Bookings</h1>
                    </div>
                    <div className="header-actions">
                        <button
                            className="theme-toggle"
                            onClick={toggleDarkMode}
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                        <button 
                            className="btn-primary"
                            onClick={() => router.push('/dashboard/customer')}
                        >
                            + New Booking
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="bookings-filters">
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by city, material, or truck..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All Bookings
                        <span className="tab-count">{bookings.length}</span>
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('active')}
                    >
                        Active
                        <span className="tab-count">
                            {bookings.filter(b => ['submitted', 'approved', 'in_transit'].includes(b.status)).length}
                        </span>
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === 'past' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('past')}
                    >
                        Past
                        <span className="tab-count">
                            {bookings.filter(b => ['delivered', 'rejected'].includes(b.status)).length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={loadBookings} className="retry-btn">
                        Retry
                    </button>
                </div>
            )}

            {/* Bookings List */}
            <div className="bookings-container">
                {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📦</div>
                        <h3>No Bookings Found</h3>
                        <p>
                            {searchQuery
                                ? 'No bookings match your search criteria'
                                : filterStatus === 'active'
                                ? 'You have no active bookings at the moment'
                                : filterStatus === 'past'
                                ? 'You have no past bookings'
                                : 'Create your first booking to get started'}
                        </p>
                        {!searchQuery && (
                            <button 
                                className="btn-primary"
                                onClick={() => router.push('/dashboard/customer')}
                            >
                                Create New Booking
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bookings-grid">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="booking-card">
                                <div className="booking-header">
                                    <div className="booking-route">
                                        <span className="route-city">{booking.source_city}</span>
                                        <span className="route-arrow">→</span>
                                        <span className="route-city">{booking.destination_city}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                        {getStatusLabel(booking.status)}
                                    </span>
                                </div>

                                <div className="booking-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Booking ID</span>
                                        <span className="detail-value">{booking.id.slice(0, 8)}</span>
                                    </div>
                                    
                                    {booking.vehicle_type && (
                                        <div className="detail-row">
                                            <span className="detail-label">Vehicle Type</span>
                                            <span className="detail-value">{booking.vehicle_type}</span>
                                        </div>
                                    )}

                                    {booking.material && (
                                        <div className="detail-row">
                                            <span className="detail-label">Material</span>
                                            <span className="detail-value">{booking.material}</span>
                                        </div>
                                    )}

                                    {booking.weight_mt && (
                                        <div className="detail-row">
                                            <span className="detail-label">Weight</span>
                                            <span className="detail-value">{booking.weight_mt} MT</span>
                                        </div>
                                    )}

                                    {booking.pickup_date && (
                                        <div className="detail-row">
                                            <span className="detail-label">Pickup Date</span>
                                            <span className="detail-value">{formatDate(booking.pickup_date)}</span>
                                        </div>
                                    )}

                                    {booking.truck_plate && (
                                        <div className="detail-row">
                                            <span className="detail-label">Truck</span>
                                            <span className="detail-value truck-plate">{booking.truck_plate}</span>
                                        </div>
                                    )}

                                    {booking.current_location && (
                                        <div className="detail-row">
                                            <span className="detail-label">Current Location</span>
                                            <span className="detail-value">{booking.current_location}</span>
                                        </div>
                                    )}

                                    {booking.eta && booking.status === 'in_transit' && (
                                        <div className="detail-row">
                                            <span className="detail-label">ETA</span>
                                            <span className="detail-value">{formatDate(booking.eta)}</span>
                                        </div>
                                    )}

                                    {booking.delivered_at && (
                                        <div className="detail-row">
                                            <span className="detail-label">Delivered At</span>
                                            <span className="detail-value">{formatDate(booking.delivered_at)}</span>
                                        </div>
                                    )}

                                    <div className="detail-row">
                                        <span className="detail-label">Created</span>
                                        <span className="detail-value">{formatDate(booking.created_at)}</span>
                                    </div>
                                </div>

                                {booking.notes && (
                                    <div className="booking-notes">
                                        <span className="notes-label">Notes:</span>
                                        <p className="notes-text">{booking.notes}</p>
                                    </div>
                                )}

                                <div className="booking-actions">
                                    {booking.shipment_id && (
                                        <button 
                                            className="btn-secondary"
                                            onClick={() => router.push('/dashboard/customer#map')}
                                        >
                                            📍 Track on Map
                                        </button>
                                    )}
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-section">
                                <h2 className="modal-title">Booking Details</h2>
                                <span className={`status-badge ${getStatusClass(selectedBooking.status)}`}>
                                    {getStatusLabel(selectedBooking.status)}
                                </span>
                            </div>
                            <button 
                                className="modal-close"
                                onClick={() => setSelectedBooking(null)}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Route Section */}
                            <div className="modal-section">
                                <h3 className="section-title">📍 Route</h3>
                                <div className="route-display">
                                    <div className="route-point">
                                        <div className="route-dot start"></div>
                                        <div className="route-info">
                                            <span className="route-label">From</span>
                                            <span className="route-city">{selectedBooking.source_city}</span>
                                        </div>
                                    </div>
                                    <div className="route-line"></div>
                                    <div className="route-point">
                                        <div className="route-dot end"></div>
                                        <div className="route-info">
                                            <span className="route-label">To</span>
                                            <span className="route-city">{selectedBooking.destination_city}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Information */}
                            <div className="modal-section">
                                <h3 className="section-title">📋 Booking Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Booking ID</span>
                                        <span className="detail-value mono">{selectedBooking.id}</span>
                                    </div>
                                    {selectedBooking.vehicle_type && (
                                        <div className="detail-item">
                                            <span className="detail-label">Vehicle Type</span>
                                            <span className="detail-value">{selectedBooking.vehicle_type}</span>
                                        </div>
                                    )}
                                    {selectedBooking.material && (
                                        <div className="detail-item">
                                            <span className="detail-label">Material</span>
                                            <span className="detail-value">{selectedBooking.material}</span>
                                        </div>
                                    )}
                                    {selectedBooking.weight_mt && (
                                        <div className="detail-item">
                                            <span className="detail-label">Weight</span>
                                            <span className="detail-value">{selectedBooking.weight_mt} MT</span>
                                        </div>
                                    )}
                                    {selectedBooking.pickup_date && (
                                        <div className="detail-item">
                                            <span className="detail-label">Pickup Date</span>
                                            <span className="detail-value">{formatDate(selectedBooking.pickup_date)}</span>
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <span className="detail-label">Created</span>
                                        <span className="detail-value">{formatDate(selectedBooking.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipment Information (if available) */}
                            {(selectedBooking.shipment_id || selectedBooking.truck_plate) && (
                                <div className="modal-section">
                                    <h3 className="section-title">🚛 Shipment Information</h3>
                                    <div className="detail-grid">
                                        {selectedBooking.shipment_id && (
                                            <div className="detail-item">
                                                <span className="detail-label">Shipment ID</span>
                                                <span className="detail-value mono">{selectedBooking.shipment_id.slice(0, 8)}...</span>
                                            </div>
                                        )}
                                        {selectedBooking.truck_plate && (
                                            <div className="detail-item">
                                                <span className="detail-label">Truck</span>
                                                <span className="detail-value truck-badge">{selectedBooking.truck_plate}</span>
                                            </div>
                                        )}
                                        {selectedBooking.current_location && (
                                            <div className="detail-item">
                                                <span className="detail-label">Current Location</span>
                                                <span className="detail-value">{selectedBooking.current_location}</span>
                                            </div>
                                        )}
                                        {selectedBooking.eta && selectedBooking.status === 'in_transit' && (
                                            <div className="detail-item">
                                                <span className="detail-label">ETA</span>
                                                <span className="detail-value">{formatDate(selectedBooking.eta)}</span>
                                            </div>
                                        )}
                                        {selectedBooking.delivered_at && (
                                            <div className="detail-item">
                                                <span className="detail-label">Delivered At</span>
                                                <span className="detail-value">{formatDate(selectedBooking.delivered_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedBooking.notes && (
                                <div className="modal-section">
                                    <h3 className="section-title">📝 Notes</h3>
                                    <div className="notes-display">
                                        {selectedBooking.notes}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="modal-actions">
                                {selectedBooking.shipment_id && (
                                    <button 
                                        className="btn-primary"
                                        onClick={() => {
                                            setSelectedBooking(null);
                                            router.push('/dashboard/customer#map');
                                        }}
                                    >
                                        📍 Track on Map
                                    </button>
                                )}
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setSelectedBooking(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
