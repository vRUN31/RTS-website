"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import './TrucksShowcase.css';

type Truck = {
    id: string;
    plate: string | null;
    display_code: string | null;
    vehicle_type: string | null;
    status: string | null;
    location: string | null;
};

export default function TrucksShowcase() {
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string>('all');

    // Load trucks data
    useEffect(() => {
        let mounted = true;
        const supabase = createClient();

        async function loadTrucks() {
            try {
                setLoading(true);
                const { data, error: fetchError } = await supabase
                    .from('trucks')
                    .select('id, plate, display_code, vehicle_type, status, location')
                    .order('vehicle_type', { ascending: true });

                if (fetchError) throw fetchError;
                if (mounted) {
                    setTrucks(data || []);
                }
            } catch (e: any) {
                if (mounted) {
                    setError(e?.message || 'Failed to load trucks');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadTrucks();

        // Set up real-time subscription for trucks
        console.log('🚚 Setting up real-time trucks subscription');
        const channel = supabase
            .channel('trucks_showcase_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trucks',
                },
                (payload) => {
                    console.log('✅ New truck added:', payload);
                    if (mounted && payload.new) {
                        setTrucks((prev) => [...prev, payload.new as Truck]);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trucks',
                },
                (payload) => {
                    console.log('✅ Truck updated:', payload);
                    if (mounted && payload.new) {
                        setTrucks((prev) => {
                            const updated = payload.new as Truck;
                            return prev.map((t) => (t.id === updated.id ? updated : t));
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'trucks',
                },
                (payload) => {
                    console.log('✅ Truck deleted:', payload);
                    if (mounted && payload.old) {
                        setTrucks((prev) => prev.filter((t) => t.id !== (payload.old as Truck).id));
                    }
                }
            )
            .subscribe((status, err) => {
                console.log('📡 Trucks subscription status:', status);
                if (err) {
                    console.error('❌ Trucks subscription error:', err);
                }
            });

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    // Get unique vehicle types
    const vehicleTypes = ['all', ...new Set(trucks.map((t) => t.vehicle_type).filter(Boolean))];

    // Filter trucks by selected type
    const filteredTrucks = selectedType === 'all' 
        ? trucks 
        : trucks.filter((t) => t.vehicle_type === selectedType);

    // Group trucks by vehicle type
    const trucksByType = filteredTrucks.reduce((acc, truck) => {
        const type = truck.vehicle_type || 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(truck);
        return acc;
    }, {} as Record<string, Truck[]>);

    // Get truck icon based on vehicle type
    const getTruckIcon = (vehicleType: string | null | undefined) => {
        if (!vehicleType) return '🚛'; // Default icon for null/undefined
        const type = vehicleType.toLowerCase();
        if (type.includes('pickup')) return '🛻';
        if (type.includes('lcv') || type.includes('3.5t')) return '🚚';
        if (type.includes('9t')) return '🚛';
        if (type.includes('16t')) return '🚜';
        if (type.includes('trailer') || type.includes('25t')) return '🚐';
        return '🚛';
    };

    // Get status color
    const getStatusColor = (status: string | null | undefined) => {
        if (!status) return '#64748b'; // Default color for null/undefined
        const s = status.toLowerCase();
        if (s === 'available') return '#10b981';
        if (s === 'running') return '#3b82f6';
        if (s === 'halt') return '#f59e0b';
        if (s === 'maintenance') return '#ef4444';
        if (s === 'offline') return '#6b7280';
        return '#64748b';
    };

    if (loading) {
        return (
            <div className="trucks-showcase-container">
                <div className="trucks-showcase-header">
                    <h2 className="trucks-showcase-title">🚛 Our Fleet</h2>
                    <p className="trucks-showcase-subtitle">Discover our diverse range of transport vehicles</p>
                </div>
                <div className="trucks-loading">
                    <div className="trucks-spinner"></div>
                    <p>Loading fleet...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="trucks-showcase-container">
                <div className="trucks-showcase-header">
                    <h2 className="trucks-showcase-title">🚛 Our Fleet</h2>
                </div>
                <div className="trucks-error">
                    <p>⚠️ {error}</p>
                </div>
            </div>
        );
    }

    if (trucks.length === 0) {
        return (
            <div className="trucks-showcase-container">
                <div className="trucks-showcase-header">
                    <h2 className="trucks-showcase-title">🚛 Our Fleet</h2>
                </div>
                <div className="trucks-empty">
                    <p>No trucks available at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="trucks-showcase-container">
            <div className="trucks-showcase-header">
                <h2 className="trucks-showcase-title">🚛 Our Fleet</h2>
                <p className="trucks-showcase-subtitle">
                    Explore our {trucks.length} vehicles across {Object.keys(trucksByType).length} categories
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="trucks-filter-tabs">
                {vehicleTypes.map((type) => (
                    <button
                        key={type}
                        className={`trucks-filter-tab ${selectedType === type ? 'active' : ''}`}
                        onClick={() => setSelectedType(type)}
                    >
                        {type === 'all' ? '🚚 All Trucks' : `${getTruckIcon(type)} ${type}`}
                        <span className="trucks-filter-count">
                            {type === 'all' ? trucks.length : trucks.filter((t) => t.vehicle_type === type).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="trucks-stats-grid">
                <div className="trucks-stat-card">
                    <div className="trucks-stat-icon">✅</div>
                    <div className="trucks-stat-value">{trucks.filter(t => t.status?.toLowerCase() === 'available').length}</div>
                    <div className="trucks-stat-label">Available</div>
                </div>
                <div className="trucks-stat-card">
                    <div className="trucks-stat-icon">🚀</div>
                    <div className="trucks-stat-value">{trucks.filter(t => t.status?.toLowerCase() === 'running').length}</div>
                    <div className="trucks-stat-label">On Trip</div>
                </div>
                <div className="trucks-stat-card">
                    <div className="trucks-stat-icon">🔧</div>
                    <div className="trucks-stat-value">{trucks.filter(t => t.status?.toLowerCase() === 'maintenance').length}</div>
                    <div className="trucks-stat-label">Maintenance</div>
                </div>
                <div className="trucks-stat-card">
                    <div className="trucks-stat-icon">🚛</div>
                    <div className="trucks-stat-value">{trucks.length}</div>
                    <div className="trucks-stat-label">Total Fleet</div>
                </div>
            </div>

            {/* Trucks Grid by Category */}
            {Object.entries(trucksByType).map(([type, typeTrucks]) => (
                <div key={type} className="trucks-category-section">
                    <h3 className="trucks-category-title">
                        {getTruckIcon(type)} {type}
                        <span className="trucks-category-count">{typeTrucks.length} vehicle{typeTrucks.length !== 1 ? 's' : ''}</span>
                    </h3>
                    
                    <div className="trucks-grid">
                        {typeTrucks.map((truck) => (
                            <div key={truck.id} className="truck-card">
                                <div className="truck-card-header">
                                    <div className="truck-icon">{getTruckIcon(truck.vehicle_type)}</div>
                                    <div 
                                        className="truck-status-badge"
                                        style={{ 
                                            background: `${getStatusColor(truck.status)}20`,
                                            color: getStatusColor(truck.status),
                                            borderColor: getStatusColor(truck.status)
                                        }}
                                    >
                                        <span className="truck-status-dot" style={{ background: getStatusColor(truck.status) }}></span>
                                        {truck.status || 'Unknown'}
                                    </div>
                                </div>
                                
                                <div className="truck-card-body">
                                    <div className="truck-plate">{truck.plate || truck.display_code || 'N/A'}</div>
                                    <div className="truck-type">{truck.vehicle_type || 'Unknown Type'}</div>
                                    
                                    {truck.location && (
                                        <div className="truck-details">
                                            <div className="truck-detail-item">
                                                <span className="truck-detail-icon">📍</span>
                                                <span className="truck-detail-text">{truck.location}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="truck-card-footer">
                                    <div className="truck-availability">
                                        {truck.status?.toLowerCase() === 'available' ? (
                                            <span className="truck-available-text">✅ Ready to book</span>
                                        ) : truck.status?.toLowerCase() === 'running' ? (
                                            <span className="truck-busy-text">🚀 On active trip</span>
                                        ) : truck.status?.toLowerCase() === 'maintenance' ? (
                                            <span className="truck-maintenance-text">🔧 Under maintenance</span>
                                        ) : (
                                            <span className="truck-unavailable-text">⏸️ Not available</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
