"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

type Shipment = {
  id: string;
  origin: string;
  destination: string;
  status: string;
  created_at: string;
  eta?: string | null;
  delivered_at?: string | null;
  distance_km?: number | null;
  cost?: number | null;
  weight_mt?: number | null;
  truck_id?: string | null;
  client_id?: string | null;
  contract_id?: string | null;
};

type TripHistoryProps = {
  truckId?: string | null;
};

export default function TripHistoryClient({ truckId }: TripHistoryProps = {}) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, week, month

  useEffect(() => {
    loadShipments();
  }, [truckId]);

  async function loadShipments() {
    const supabase = createClient();
    setLoading(true);
    
    try {
      // Build query based on whether we have a specific truck
      let query = supabase
        .from('shipments')
        .select('id, origin, destination, status, created_at, eta, delivered_at, distance_km, cost, weight_mt, truck_id, client_id, contract_id')
        .order('created_at', { ascending: false });

      // Filter by truck if provided
      if (truckId) {
        query = query.eq('truck_id', truckId);
      }

      query = query.limit(100);

      const { data: shipmentsData, error: shipmentsError } = await query;

      if (shipmentsError) throw shipmentsError;

      setShipments((shipmentsData as Shipment[]) || []);
    } catch (e: any) {
      console.error('Error loading trip history:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTrip(e: React.FormEvent) {
    e.preventDefault();
    // This function is kept for potential future use but not currently active
    // Trips are created automatically when bookings are approved
  }

  // Statistics
  const stats = useMemo(() => {
    // Map shipment statuses to trip-like statuses
    const pending = shipments.filter(s => s.status === 'pending').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const cancelled = shipments.filter(s => s.status === 'cancelled').length;
    
    return {
      total: shipments.length,
      pending,
      in_transit: inTransit,
      delivered,
      cancelled,
      total_distance: shipments.reduce((sum, s) => sum + (s.distance_km || 0), 0),
      avg_distance: shipments.length > 0 
        ? shipments.reduce((sum, s) => sum + (s.distance_km || 0), 0) / shipments.length 
        : 0,
      total_revenue: shipments.reduce((sum, s) => sum + (s.cost || 0), 0),
    };
  }, [shipments]);

  // Filtered shipments/trips
  const filteredShipments = useMemo(() => {
    let filtered = shipments.filter(shipment => {
      const matchesSearch = 
        shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const shipmentDate = new Date(shipment.created_at);
        const now = new Date();
        
        if (dateFilter === 'today') {
          matchesDate = shipmentDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = shipmentDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = shipmentDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered;
  }, [shipments, searchQuery, statusFilter, dateFilter]);

  if (loading) return <div className="loading-spinner">Loading trips...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="trip-history-container">
      {/* Header with truck filter info */}
      {truckId && (
        <div className="filter-info-banner">
          <span className="info-icon">🚛</span>
          <span>Showing trip history for selected truck</span>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Trips</div>
          </div>
        </div>
        <div className="stat-card stat-card-pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card stat-card-progress">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <div className="stat-value">{stats.in_transit}</div>
            <div className="stat-label">In Transit</div>
          </div>
        </div>
        <div className="stat-card stat-card-completed">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.delivered}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>
        <div className="stat-card stat-card-distance">
          <div className="stat-icon">📏</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_distance.toFixed(0)}</div>
            <div className="stat-label">Total KM</div>
          </div>
        </div>
        <div className="stat-card stat-card-revenue">
          <div className="stat-icon">�</div>
          <div className="stat-content">
            <div className="stat-value">₹{(stats.total_revenue / 1000).toFixed(1)}K</div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="info-text">
          <span className="info-icon">ℹ️</span>
          <span>Trip records are automatically created when bookings are approved</span>
        </div>

        <div className="filters-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search origin/destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="results-info">
        <h3>Trip Records</h3>
        <span>Showing {filteredShipments.length} of {shipments.length} trips</span>
      </div>

      {/* Trips Table */}
      {filteredShipments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <h3>No trips found</h3>
          <p>
            {truckId 
              ? 'This truck has no trip history yet. Trips are created when admin approves bookings and assigns this truck.'
              : 'Try adjusting your filters or wait for bookings to be approved'
            }
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Route</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Distance</th>
                <th>ETA</th>
                <th>Delivered</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment, index) => (
                <tr key={shipment.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>{new Date(shipment.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="route-cell">
                      <div className="route-origin">{shipment.origin}</div>
                      <div className="route-arrow">→</div>
                      <div className="route-destination">{shipment.destination}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${shipment.status}`}>
                      {shipment.status === 'pending' && '⏳ '}
                      {shipment.status === 'in_transit' && '🚚 '}
                      {shipment.status === 'delivered' && '✓ '}
                      {shipment.status === 'cancelled' && '✖ '}
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{shipment.weight_mt ? `${shipment.weight_mt}T` : '—'}</td>
                  <td>{shipment.distance_km ? `${shipment.distance_km} km` : '—'}</td>
                  <td>{shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '—'}</td>
                  <td>{shipment.delivered_at ? new Date(shipment.delivered_at).toLocaleDateString() : '—'}</td>
                  <td>{shipment.cost ? `₹${shipment.cost.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
