"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { FuelRecord } from '@/src/types/fleet';

export default function FuelTrackingClient() {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);

  const [newRecord, setNewRecord] = useState({
    truck_id: '',
    filled_at: '',
    location: '',
    fuel_type: 'diesel',
    quantity_liters: '',
    price_per_liter: '',
    odometer_reading: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('filled_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate')
        .order('display_code');

      setRecords((data as FuelRecord[]) || []);
      setTrucks(trucksData || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();

    const supabase = createClient();
    const quantity = parseFloat(newRecord.quantity_liters);
    const pricePerLiter = parseFloat(newRecord.price_per_liter);

    const { error } = await supabase.from('fuel_records').insert({
      truck_id: newRecord.truck_id,
      filled_at: newRecord.filled_at,
      location: newRecord.location || null,
      fuel_type: newRecord.fuel_type,
      quantity_liters: quantity,
      price_per_liter: pricePerLiter,
      total_cost: quantity * pricePerLiter,
      odometer_reading: newRecord.odometer_reading ? parseFloat(newRecord.odometer_reading) : null,
    });

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    setShowAddForm(false);
    setNewRecord({
      truck_id: '',
      filled_at: '',
      location: '',
      fuel_type: 'diesel',
      quantity_liters: '',
      price_per_liter: '',
      odometer_reading: '',
    });
    loadData();
  }

  const stats = useMemo(() => {
    const totalLiters = records.reduce((sum, r) => sum + (r.quantity_liters || 0), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.total_cost || 0), 0);
    const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

    // Calculate efficiency (km per liter)
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.filled_at).getTime() - new Date(b.filled_at).getTime()
    );

    let totalDistance = 0;
    for (let i = 1; i < sortedRecords.length; i++) {
      const curr = sortedRecords[i];
      const prev = sortedRecords[i - 1];
      if (curr.truck_id === prev.truck_id && curr.odometer_reading && prev.odometer_reading) {
        totalDistance += curr.odometer_reading - prev.odometer_reading;
      }
    }

    const avgEfficiency = totalLiters > 0 && totalDistance > 0 ? totalDistance / totalLiters : 0;

    return {
      total_records: records.length,
      total_liters: totalLiters,
      total_cost: totalCost,
      avg_cost_per_liter: avgCostPerLiter,
      avg_efficiency: avgEfficiency,
      total_distance: totalDistance,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        record.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.truck_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFuelType = fuelTypeFilter === 'all' || record.fuel_type === fuelTypeFilter;

      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(record.filled_at) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchesDate = matchesDate && new Date(record.filled_at) <= new Date(dateRange.end);
      }
      
      return matchesSearch && matchesFuelType && matchesDate;
    });
  }, [records, searchQuery, fuelTypeFilter, dateRange]);

  if (loading) return <div className="loading-spinner">Loading fuel tracking data...</div>;

  return (
    <div className="fuel-tracking-container">
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">⛽</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_records}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card stat-card-fuel">
          <div className="stat-icon">🛢️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_liters.toFixed(0)} L</div>
            <div className="stat-label">Total Fuel</div>
          </div>
        </div>
        <div className="stat-card stat-card-cost">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.total_cost.toFixed(0)}</div>
            <div className="stat-label">Total Cost</div>
          </div>
        </div>
        <div className="stat-card stat-card-price">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.avg_cost_per_liter.toFixed(2)}/L</div>
            <div className="stat-label">Avg Price</div>
          </div>
        </div>
        <div className="stat-card stat-card-efficiency">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avg_efficiency.toFixed(2)} km/L</div>
            <div className="stat-label">Avg Efficiency</div>
          </div>
        </div>
        <div className="stat-card stat-card-distance">
          <div className="stat-icon">🛣️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_distance.toFixed(0)} km</div>
            <div className="stat-label">Total Distance</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className="btn-add" onClick={() => setShowAddForm(!showAddForm)}>
          <span className="btn-icon">➕</span>
          <span className="btn-text">{showAddForm ? 'Close' : 'Add Fuel Record'}</span>
        </button>

        <div className="filters-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search location/truck..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="filter-select"
            value={fuelTypeFilter}
            onChange={(e) => setFuelTypeFilter(e.target.value)}
          >
            <option value="all">All Fuel Types</option>
            <option value="diesel">Diesel</option>
            <option value="petrol">Petrol</option>
            <option value="cng">CNG</option>
            <option value="electric">Electric</option>
          </select>

          <input
            type="date"
            className="date-input"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            placeholder="Start Date"
          />

          <input
            type="date"
            className="date-input"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-form-panel">
          <h3>Add Fuel Record</h3>
          <form className="fuel-form" onSubmit={handleAddRecord}>
            <select
              className="form-select"
              value={newRecord.truck_id}
              onChange={(e) => setNewRecord({...newRecord, truck_id: e.target.value})}
              required
            >
              <option value="">Select Truck</option>
              {trucks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.display_code} - {t.plate}
                </option>
              ))}
            </select>

            <div className="form-row">
              <input
                className="form-input"
                type="date"
                value={newRecord.filled_at}
                onChange={(e) => setNewRecord({...newRecord, filled_at: e.target.value})}
                required
              />

              <input
                className="form-input"
                type="text"
                placeholder="Location"
                value={newRecord.location}
                onChange={(e) => setNewRecord({...newRecord, location: e.target.value})}
              />
            </div>

            <select
              className="form-select"
              value={newRecord.fuel_type}
              onChange={(e) => setNewRecord({...newRecord, fuel_type: e.target.value})}
            >
              <option value="diesel">🛢️ Diesel</option>
              <option value="petrol">⛽ Petrol</option>
              <option value="cng">🔥 CNG</option>
              <option value="electric">⚡ Electric</option>
            </select>

            <div className="form-row">
              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="Quantity (liters)"
                value={newRecord.quantity_liters}
                onChange={(e) => setNewRecord({...newRecord, quantity_liters: e.target.value})}
                required
              />

              <input
                className="form-input"
                type="number"
                step="0.01"
                placeholder="Cost per Liter (₹)"
                value={newRecord.price_per_liter}
                onChange={(e) => setNewRecord({...newRecord, price_per_liter: e.target.value})}
                required
              />
            </div>

            <input
              className="form-input"
              type="number"
              step="0.1"
              placeholder="Odometer Reading (km)"
              value={newRecord.odometer_reading}
              onChange={(e) => setNewRecord({...newRecord, odometer_reading: e.target.value})}
            />

            {newRecord.quantity_liters && newRecord.price_per_liter && (
              <div className="cost-preview">
                Total Cost: ₹{(parseFloat(newRecord.quantity_liters) * parseFloat(newRecord.price_per_liter)).toFixed(2)}
              </div>
            )}

            <button type="submit" className="btn-submit">
              <span className="btn-icon">✓</span>
              <span className="btn-text">Add Record</span>
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      <div className="results-info">
        <h3>Fuel Records</h3>
        <span>Showing {filteredRecords.length} of {records.length} records</span>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⛽</div>
          <h3>No fuel records</h3>
          <p>Add fuel records to track consumption and costs</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Truck</th>
                <th>Location</th>
                <th>Fuel Type</th>
                <th>Quantity</th>
                <th>Price/L</th>
                <th>Total Cost</th>
                <th>Odometer</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <tr key={record.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>{new Date(record.filled_at).toLocaleDateString()}</td>
                  <td>{record.truck_id || '—'}</td>
                  <td>{record.location || '—'}</td>
                  <td>
                    <span className={`fuel-type fuel-${record.fuel_type}`}>
                      {record.fuel_type === 'diesel' && '🛢️ '}
                      {record.fuel_type === 'petrol' && '⛽ '}
                      {record.fuel_type === 'cng' && '🔥 '}
                      {record.fuel_type === 'electric' && '⚡ '}
                      {record.fuel_type}
                    </span>
                  </td>
                  <td>{(record.quantity_liters || 0).toFixed(2)} L</td>
                  <td>₹{(record.price_per_liter || 0).toFixed(2)}</td>
                  <td className="cost-cell">₹{(record.total_cost || 0).toFixed(2)}</td>
                  <td>{record.odometer_reading ? `${record.odometer_reading.toFixed(0)} km` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
