"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Trip } from '@/src/types/fleet';

export default function TripHistoryClient() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, week, month
  
  // New Trip Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  const [newTrip, setNewTrip] = useState({
    truck_id: '',
    driver_id: '',
    origin: '',
    destination: '',
    start_time: '',
    planned_distance_km: '',
    planned_duration_hours: '',
    status: 'scheduled'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    setLoading(true);
    
    try {
      // Load trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(100);

      if (tripsError) throw tripsError;

      // Load trucks for dropdown
      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate')
        .order('display_code');

      // Load drivers for dropdown
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, name, phone')
        .order('name');

      setTrips((tripsData as Trip[]) || []);
      setTrucks(trucksData || []);
      setDrivers(driversData || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTrip(e: React.FormEvent) {
    e.preventDefault();
    
    const supabase = createClient();
    const { error } = await supabase.from('trips').insert({
      truck_id: newTrip.truck_id || null,
      driver_id: newTrip.driver_id || null,
      origin: newTrip.origin,
      destination: newTrip.destination,
      start_time: newTrip.start_time,
      planned_distance_km: newTrip.planned_distance_km ? parseFloat(newTrip.planned_distance_km) : null,
      planned_duration_hours: newTrip.planned_duration_hours ? parseFloat(newTrip.planned_duration_hours) : null,
      status: newTrip.status,
    });

    if (error) {
      alert('Error creating trip: ' + error.message);
      return;
    }

    setShowAddForm(false);
    setNewTrip({
      truck_id: '',
      driver_id: '',
      origin: '',
      destination: '',
      start_time: '',
      planned_distance_km: '',
      planned_duration_hours: '',
      status: 'scheduled'
    });
    loadData();
  }

  // Statistics
  const stats = useMemo(() => {
    return {
      total: trips.length,
      scheduled: trips.filter(t => t.status === 'scheduled').length,
      in_progress: trips.filter(t => t.status === 'in_progress').length,
      completed: trips.filter(t => t.status === 'completed').length,
      cancelled: trips.filter(t => t.status === 'cancelled').length,
      total_distance: trips.reduce((sum, t) => sum + (t.actual_distance_km || 0), 0),
      avg_distance: trips.length > 0 
        ? trips.reduce((sum, t) => sum + (t.actual_distance_km || 0), 0) / trips.length 
        : 0,
    };
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    let filtered = trips.filter(trip => {
      const matchesSearch = 
        trip.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const tripDate = new Date(trip.start_time);
        const now = new Date();
        
        if (dateFilter === 'today') {
          matchesDate = tripDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = tripDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = tripDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered;
  }, [trips, searchQuery, statusFilter, dateFilter]);

  if (loading) return <div className="loading-spinner">Loading trips...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="trip-history-container">
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Trips</div>
          </div>
        </div>
        <div className="stat-card stat-card-scheduled">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.scheduled}</div>
            <div className="stat-label">Scheduled</div>
          </div>
        </div>
        <div className="stat-card stat-card-progress">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <div className="stat-value">{stats.in_progress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card stat-card-completed">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card stat-card-distance">
          <div className="stat-icon">📏</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_distance.toFixed(0)}</div>
            <div className="stat-label">Total KM</div>
          </div>
        </div>
        <div className="stat-card stat-card-avg">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avg_distance.toFixed(1)}</div>
            <div className="stat-label">Avg KM/Trip</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className="btn-add" onClick={() => setShowAddForm(!showAddForm)}>
          <span className="btn-icon">➕</span>
          <span className="btn-text">{showAddForm ? 'Close' : 'New Trip'}</span>
        </button>

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
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
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

      {/* Add Trip Form */}
      {showAddForm && (
        <div className="add-form-panel">
          <h3>Schedule New Trip</h3>
          <form className="trip-form" onSubmit={handleAddTrip}>
            <select
              className="form-select"
              value={newTrip.truck_id}
              onChange={(e) => setNewTrip({...newTrip, truck_id: e.target.value})}
              required
            >
              <option value="">Select Truck</option>
              {trucks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.display_code} - {t.plate}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={newTrip.driver_id}
              onChange={(e) => setNewTrip({...newTrip, driver_id: e.target.value})}
            >
              <option value="">Select Driver (Optional)</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <input
              className="form-input"
              type="text"
              placeholder="Origin"
              value={newTrip.origin}
              onChange={(e) => setNewTrip({...newTrip, origin: e.target.value})}
              required
            />

            <input
              className="form-input"
              type="text"
              placeholder="Destination"
              value={newTrip.destination}
              onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
              required
            />

            <input
              className="form-input"
              type="datetime-local"
              value={newTrip.start_time}
              onChange={(e) => setNewTrip({...newTrip, start_time: e.target.value})}
              required
            />

            <input
              className="form-input"
              type="number"
              step="0.1"
              placeholder="Distance (km)"
              value={newTrip.planned_distance_km}
              onChange={(e) => setNewTrip({...newTrip, planned_distance_km: e.target.value})}
            />

            <input
              className="form-input"
              type="number"
              step="0.1"
              placeholder="Duration (hours)"
              value={newTrip.planned_duration_hours}
              onChange={(e) => setNewTrip({...newTrip, planned_duration_hours: e.target.value})}
            />

            <button type="submit" className="btn-submit">
              <span className="btn-icon">✓</span>
              <span className="btn-text">Create Trip</span>
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      <div className="results-info">
        <h3>Trip Records</h3>
        <span>Showing {filteredTrips.length} of {trips.length} trips</span>
      </div>

      {/* Trips Table */}
      {filteredTrips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <h3>No trips found</h3>
          <p>Try adjusting your filters or create a new trip</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Route</th>
                <th>Truck</th>
                <th>Status</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip, index) => (
                <tr key={trip.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>{new Date(trip.start_time).toLocaleDateString()}</td>
                  <td>
                    <div className="route-cell">
                      <div className="route-origin">{trip.origin}</div>
                      <div className="route-arrow">→</div>
                      <div className="route-destination">{trip.destination}</div>
                    </div>
                  </td>
                  <td>{trip.truck_id || '—'}</td>
                  <td>
                    <span className={`status-badge status-${trip.status}`}>
                      {trip.status === 'scheduled' && '📅 '}
                      {trip.status === 'in_progress' && '🚚 '}
                      {trip.status === 'completed' && '✓ '}
                      {trip.status === 'cancelled' && '✖ '}
                      {trip.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{trip.actual_distance_km || trip.planned_distance_km || '—'} km</td>
                  <td>{trip.actual_duration_hours || trip.planned_duration_hours || '—'} hrs</td>
                  <td>{trip.total_cost ? `₹${trip.total_cost.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
