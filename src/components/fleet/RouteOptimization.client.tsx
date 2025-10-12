"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { OptimizedRoute } from '@/src/types/fleet';

export default function RouteOptimizationClient() {
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);

  const [newRoute, setNewRoute] = useState({
    origin: '',
    destination: '',
    optimization_criteria: 'fastest',
    waypoints_json: '[]',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('optimized_routes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate')
        .order('display_code');

      setRoutes((data as OptimizedRoute[]) || []);
      setTrucks(trucksData || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRoute(e: React.FormEvent) {
    e.preventDefault();

    const supabase = createClient();
    
    // Parse waypoints
    let waypoints = [];
    try {
      waypoints = JSON.parse(newRoute.waypoints_json || '[]');
    } catch {
      waypoints = [];
    }

    const { error } = await supabase.from('optimized_routes').insert({
      origin: newRoute.origin,
      destination: newRoute.destination,
      optimization_criteria: newRoute.optimization_criteria,
      waypoints: waypoints,
    });

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    setShowAddForm(false);
    setNewRoute({
      origin: '',
      destination: '',
      optimization_criteria: 'fastest',
      waypoints_json: '[]',
    });
    loadData();
  }

  const stats = useMemo(() => {
    const totalDistance = routes.reduce((sum, r) => sum + (r.total_distance_km || 0), 0);
    const totalDuration = routes.reduce((sum, r) => sum + ((r.estimated_duration_hours || 0) * 60), 0); // Convert to minutes
    const totalCost = routes.reduce((sum, r) => sum + (r.estimated_total_cost || 0), 0);

    const avgSavings = 0; // Not available in schema

    return {
      total_routes: routes.length,
      total_distance: totalDistance,
      total_duration: totalDuration,
      total_cost: totalCost,
      avg_time_savings: avgSavings,
      active_routes: routes.length, // All routes are active since there's no completed_at field
    };
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const matchesSearch = 
        route.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.destination?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStrategy = strategyFilter === 'all' || route.optimization_criteria === strategyFilter;
      
      return matchesSearch && matchesStrategy;
    });
  }, [routes, searchQuery, strategyFilter]);

  if (loading) return <div className="loading-spinner">Loading route optimization data...</div>;

  return (
    <div className="route-optimization-container">
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">🗺️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_routes}</div>
            <div className="stat-label">Total Routes</div>
          </div>
        </div>
        <div className="stat-card stat-card-distance">
          <div className="stat-icon">📏</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_distance.toFixed(0)} km</div>
            <div className="stat-label">Total Distance</div>
          </div>
        </div>
        <div className="stat-card stat-card-duration">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{(stats.total_duration / 60).toFixed(1)} hrs</div>
            <div className="stat-label">Total Duration</div>
          </div>
        </div>
        <div className="stat-card stat-card-cost">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.total_cost.toFixed(0)}</div>
            <div className="stat-label">Total Cost</div>
          </div>
        </div>
        <div className="stat-card stat-card-savings">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avg_time_savings.toFixed(0)} min</div>
            <div className="stat-label">Avg Time Saved</div>
          </div>
        </div>
        <div className="stat-card stat-card-active">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active_routes}</div>
            <div className="stat-label">Active Routes</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className="btn-add" onClick={() => setShowAddForm(!showAddForm)}>
          <span className="btn-icon">➕</span>
          <span className="btn-text">{showAddForm ? 'Close' : 'Optimize Route'}</span>
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
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
          >
            <option value="all">All Strategies</option>
            <option value="fastest">Fastest</option>
            <option value="shortest">Shortest</option>
            <option value="economical">Economical</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-form-panel">
          <h3>Optimize New Route</h3>
          <form className="route-form" onSubmit={handleAddRoute}>
            <div className="form-row">
              <input
                className="form-input"
                type="text"
                placeholder="Origin (e.g., Mumbai, MH)"
                value={newRoute.origin}
                onChange={(e) => setNewRoute({...newRoute, origin: e.target.value})}
                required
              />

              <input
                className="form-input"
                type="text"
                placeholder="Destination (e.g., Delhi, DL)"
                value={newRoute.destination}
                onChange={(e) => setNewRoute({...newRoute, destination: e.target.value})}
                required
              />
            </div>

            <select
              className="form-select"
              value={newRoute.optimization_criteria}
              onChange={(e) => setNewRoute({...newRoute, optimization_criteria: e.target.value})}
            >
              <option value="fastest">⚡ Fastest (Minimize Time)</option>
              <option value="shortest">📏 Shortest (Minimize Distance)</option>
              <option value="economical">💰 Economical (Minimize Cost)</option>
              <option value="balanced">⚖️ Balanced (Best Overall)</option>
            </select>

            <textarea
              className="form-textarea"
              placeholder='Waypoints (JSON array, e.g., [{"name": "Pune"}, {"name": "Nashik"}])'
              value={newRoute.waypoints_json}
              onChange={(e) => setNewRoute({...newRoute, waypoints_json: e.target.value})}
              rows={3}
            />

            <div className="form-note">
              <p>💡 <strong>Note:</strong> Route optimization calculates the most efficient path based on your selected strategy. Multiple alternatives may be generated.</p>
            </div>

            <button type="submit" className="btn-submit">
              <span className="btn-icon">🗺️</span>
              <span className="btn-text">Optimize Route</span>
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      <div className="results-info">
        <h3>Optimized Routes</h3>
        <span>Showing {filteredRoutes.length} of {routes.length} routes</span>
      </div>

      {/* Table */}
      {filteredRoutes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h3>No optimized routes</h3>
          <p>Create a route optimization to find the best path</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Strategy</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Est. Cost</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route, index) => (
                <tr key={route.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>
                    <div className="route-path">
                      <span className="route-origin">{route.origin}</span>
                      <span className="route-arrow"> → </span>
                      <span className="route-destination">{route.destination}</span>
                    </div>
                    {route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 0 && (
                      <div className="route-waypoints">
                        via {route.waypoints.length} waypoint(s)
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`strategy-badge strategy-${route.optimization_criteria}`}>
                      {route.optimization_criteria === 'fastest' && '⚡ '}
                      {route.optimization_criteria === 'shortest' && '📏 '}
                      {route.optimization_criteria === 'economical' && '💰 '}
                      {route.optimization_criteria === 'balanced' && '⚖️ '}
                      {route.optimization_criteria}
                    </span>
                  </td>
                  <td>{(route.total_distance_km || 0).toFixed(1)} km</td>
                  <td>{((route.estimated_duration_hours || 0) * 60).toFixed(0)} min</td>
                  <td>₹{(route.estimated_total_cost || 0).toFixed(0)}</td>
                  <td>
                    <span className="usage-count">
                      {route.times_used || 0} time{(route.times_used || 0) !== 1 ? 's' : ''}
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
