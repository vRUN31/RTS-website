"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { DriverPerformance } from '@/src/types/fleet';

export default function DriverPerformanceClient() {
  const [performances, setPerformances] = useState<DriverPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);

  const [newPerformance, setNewPerformance] = useState({
    driver_id: '',
    total_trips: '',
    completed_trips: '',
    on_time_percentage: '',
    average_speed: '',
    efficiency_score: '',
    safety_score: '',
    customer_rating: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('driver_performance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, name, license_number')
        .order('name');

      setPerformances((data as DriverPerformance[]) || []);
      setDrivers(driversData || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPerformance(e: React.FormEvent) {
    e.preventDefault();

    const supabase = createClient();
    const { error } = await supabase.from('driver_performance').insert({
      driver_id: newPerformance.driver_id,
      total_trips: parseInt(newPerformance.total_trips) || 0,
      completed_trips: parseInt(newPerformance.completed_trips) || 0,
      on_time_percentage: parseFloat(newPerformance.on_time_percentage) || 0,
      average_speed: parseFloat(newPerformance.average_speed) || 0,
      efficiency_score: parseFloat(newPerformance.efficiency_score) || 0,
      safety_score: parseFloat(newPerformance.safety_score) || 0,
      customer_rating: parseFloat(newPerformance.customer_rating) || 0,
    });

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    setShowAddForm(false);
    setNewPerformance({
      driver_id: '',
      total_trips: '',
      completed_trips: '',
      on_time_percentage: '',
      average_speed: '',
      efficiency_score: '',
      safety_score: '',
      customer_rating: '',
    });
    loadData();
  }

  const stats = useMemo(() => {
    const avgSafety = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.safety_score || 0), 0) / performances.length
      : 0;

    const avgRating = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.customer_rating || 0), 0) / performances.length
      : 0;

    const avgOnTime = performances.length > 0
      ? performances.reduce((sum, p) => sum + (p.on_time_percentage || 0), 0) / performances.length
      : 0;

    const totalTrips = performances.reduce((sum, p) => sum + (p.total_trips || 0), 0);
    const totalCompleted = performances.reduce((sum, p) => sum + (p.completed_trips || 0), 0);

    return {
      total_drivers: performances.length,
      avg_safety_score: avgSafety,
      avg_customer_rating: avgRating,
      avg_on_time: avgOnTime,
      total_trips: totalTrips,
      completion_rate: totalTrips > 0 ? (totalCompleted / totalTrips) * 100 : 0,
    };
  }, [performances]);

  const filteredPerformances = useMemo(() => {
    return performances.filter(perf => {
      const matchesSearch = perf.driver_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRating = ratingFilter === 'all' || 
        (ratingFilter === 'excellent' && (perf.customer_rating || 0) >= 4.5) ||
        (ratingFilter === 'good' && (perf.customer_rating || 0) >= 3.5 && (perf.customer_rating || 0) < 4.5) ||
        (ratingFilter === 'average' && (perf.customer_rating || 0) >= 2.5 && (perf.customer_rating || 0) < 3.5) ||
        (ratingFilter === 'poor' && (perf.customer_rating || 0) < 2.5);
      
      return matchesSearch && matchesRating;
    });
  }, [performances, searchQuery, ratingFilter]);

  if (loading) return <div className="loading-spinner">Loading driver performance data...</div>;

  return (
    <div className="driver-performance-container">
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👨‍✈️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_drivers}</div>
            <div className="stat-label">Total Drivers</div>
          </div>
        </div>
        <div className="stat-card stat-card-safety">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avg_safety_score.toFixed(1)}/10</div>
            <div className="stat-label">Avg Safety Score</div>
          </div>
        </div>
        <div className="stat-card stat-card-rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avg_customer_rating.toFixed(1)}/5</div>
            <div className="stat-label">Avg Customer Rating</div>
          </div>
        </div>
        <div className="stat-card stat-card-ontime">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avg_on_time.toFixed(1)}%</div>
            <div className="stat-label">On-Time Delivery</div>
          </div>
        </div>
        <div className="stat-card stat-card-trips">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_trips}</div>
            <div className="stat-label">Total Trips</div>
          </div>
        </div>
        <div className="stat-card stat-card-completion">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completion_rate.toFixed(1)}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className="btn-add" onClick={() => setShowAddForm(!showAddForm)}>
          <span className="btn-icon">➕</span>
          <span className="btn-text">{showAddForm ? 'Close' : 'Add Performance Record'}</span>
        </button>

        <div className="filters-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="excellent">Excellent (4.5+)</option>
            <option value="good">Good (3.5-4.5)</option>
            <option value="average">Average (2.5-3.5)</option>
            <option value="poor">Poor (&lt;2.5)</option>
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-form-panel">
          <h3>Add Performance Record</h3>
          <form className="performance-form" onSubmit={handleAddPerformance}>
            <select
              className="form-select"
              value={newPerformance.driver_id}
              onChange={(e) => setNewPerformance({...newPerformance, driver_id: e.target.value})}
              required
            >
              <option value="">Select Driver</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} - {d.license_number}
                </option>
              ))}
            </select>

            <div className="form-row">
              <input
                className="form-input"
                type="number"
                placeholder="Total Trips"
                value={newPerformance.total_trips}
                onChange={(e) => setNewPerformance({...newPerformance, total_trips: e.target.value})}
              />

              <input
                className="form-input"
                type="number"
                placeholder="Completed Trips"
                value={newPerformance.completed_trips}
                onChange={(e) => setNewPerformance({...newPerformance, completed_trips: e.target.value})}
              />
            </div>

            <div className="form-row">
              <input
                className="form-input"
                type="number"
                step="0.1"
                placeholder="On-Time % (0-100)"
                value={newPerformance.on_time_percentage}
                onChange={(e) => setNewPerformance({...newPerformance, on_time_percentage: e.target.value})}
              />

              <input
                className="form-input"
                type="number"
                step="0.1"
                placeholder="Avg Speed (km/h)"
                value={newPerformance.average_speed}
                onChange={(e) => setNewPerformance({...newPerformance, average_speed: e.target.value})}
              />
            </div>

            <div className="form-row">
              <input
                className="form-input"
                type="number"
                step="0.1"
                placeholder="Fuel Efficiency (0-10)"
                value={newPerformance.efficiency_score}
                onChange={(e) => setNewPerformance({...newPerformance, efficiency_score: e.target.value})}
              />

              <input
                className="form-input"
                type="number"
                step="0.1"
                placeholder="Safety Score (0-10)"
                value={newPerformance.safety_score}
                onChange={(e) => setNewPerformance({...newPerformance, safety_score: e.target.value})}
              />
            </div>

            <input
              className="form-input"
              type="number"
              step="0.1"
              placeholder="Customer Rating (0-5)"
              value={newPerformance.customer_rating}
              onChange={(e) => setNewPerformance({...newPerformance, customer_rating: e.target.value})}
            />

            <button type="submit" className="btn-submit">
              <span className="btn-icon">✓</span>
              <span className="btn-text">Add Record</span>
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      <div className="results-info">
        <h3>Driver Performance</h3>
        <span>Showing {filteredPerformances.length} of {performances.length} records</span>
      </div>

      {/* Table */}
      {filteredPerformances.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍✈️</div>
          <h3>No performance records</h3>
          <p>Add performance records to track driver metrics</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Trips</th>
                <th>Completed</th>
                <th>On-Time %</th>
                <th>Safety</th>
                <th>Fuel Efficiency</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformances.map((perf, index) => (
                <tr key={perf.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>{perf.driver_id || '—'}</td>
                  <td>{perf.total_trips || 0}</td>
                  <td>{perf.completed_trips || 0}</td>
                  <td>
                    <span className={`percentage ${(perf.on_time_percentage || 0) >= 80 ? 'high' : (perf.on_time_percentage || 0) >= 60 ? 'medium' : 'low'}`}>
                      {(perf.on_time_percentage || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span className={`score ${(perf.safety_score || 0) >= 8 ? 'high' : (perf.safety_score || 0) >= 6 ? 'medium' : 'low'}`}>
                      {(perf.safety_score || 0).toFixed(1)}/10
                    </span>
                  </td>
                  <td>
                    <span className={`score ${(perf.efficiency_score || 0) >= 8 ? 'high' : (perf.efficiency_score || 0) >= 6 ? 'medium' : 'low'}`}>
                      {(perf.efficiency_score || 0).toFixed(1)}/10
                    </span>
                  </td>
                  <td>
                    <span className="rating">
                      {'⭐'.repeat(Math.round(perf.customer_rating || 0))}
                      <span className="rating-value"> {(perf.customer_rating || 0).toFixed(1)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
