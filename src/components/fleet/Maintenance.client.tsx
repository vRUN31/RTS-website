"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { MaintenanceRecord } from '@/src/types/fleet';

export default function MaintenanceClient() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);

  const [newRecord, setNewRecord] = useState({
    truck_id: '',
    maintenance_type: 'oil_change',
    description: '',
    scheduled_date: '',
    priority: 'normal',
    estimated_cost: '',
    service_provider: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .limit(100);

      if (error) throw error;

      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate')
        .order('display_code');

      setRecords((data as MaintenanceRecord[]) || []);
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
    const { error } = await supabase.from('maintenance_records').insert({
      truck_id: newRecord.truck_id,
      maintenance_type: newRecord.maintenance_type,
      description: newRecord.description || null,
      scheduled_date: newRecord.scheduled_date,
      priority: newRecord.priority,
      estimated_cost: newRecord.estimated_cost ? parseFloat(newRecord.estimated_cost) : null,
      service_provider: newRecord.service_provider || null,
      status: 'scheduled',
    });

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    setShowAddForm(false);
    setNewRecord({
      truck_id: '',
      maintenance_type: 'oil_change',
      description: '',
      scheduled_date: '',
      priority: 'normal',
      estimated_cost: '',
      service_provider: '',
    });
    loadData();
  }

  const stats = useMemo(() => {
    const now = new Date();
    const overdue = records.filter(r => 
      r.status === 'scheduled' && new Date(r.scheduled_date) < now
    ).length;

    return {
      total: records.length,
      scheduled: records.filter(r => r.status === 'scheduled').length,
      in_progress: records.filter(r => r.status === 'in_progress').length,
      completed: records.filter(r => r.status === 'completed').length,
      overdue,
      total_cost: records
        .filter(r => r.actual_cost)
        .reduce((sum, r) => sum + (r.actual_cost || 0), 0),
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        record.maintenance_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.description && record.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || record.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [records, searchQuery, statusFilter, priorityFilter]);

  if (loading) return <div className="loading-spinner">Loading maintenance records...</div>;

  return (
    <div className="maintenance-container">
      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Records</div>
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
          <div className="stat-icon">⚙️</div>
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
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
        <div className="stat-card stat-card-cost">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">₹{stats.total_cost.toFixed(0)}</div>
            <div className="stat-label">Total Cost</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <button className="btn-add" onClick={() => setShowAddForm(!showAddForm)}>
          <span className="btn-icon">➕</span>
          <span className="btn-text">{showAddForm ? 'Close' : 'Schedule Maintenance'}</span>
        </button>

        <div className="filters-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search maintenance..."
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
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-form-panel">
          <h3>Schedule Maintenance</h3>
          <form className="maintenance-form" onSubmit={handleAddRecord}>
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

            <select
              className="form-select"
              value={newRecord.maintenance_type}
              onChange={(e) => setNewRecord({...newRecord, maintenance_type: e.target.value})}
              required
            >
              <option value="oil_change">🛢️ Oil Change</option>
              <option value="tire_rotation">🔄 Tire Rotation</option>
              <option value="brake_service">🛑 Brake Service</option>
              <option value="engine_repair">🔧 Engine Repair</option>
              <option value="transmission_service">⚙️ Transmission Service</option>
              <option value="battery_replacement">🔋 Battery Replacement</option>
              <option value="inspection">🔍 Inspection</option>
              <option value="other">📋 Other</option>
            </select>

            <select
              className="form-select"
              value={newRecord.priority}
              onChange={(e) => setNewRecord({...newRecord, priority: e.target.value})}
            >
              <option value="low">⬇️ Low Priority</option>
              <option value="normal">➡️ Normal Priority</option>
              <option value="high">⬆️ High Priority</option>
              <option value="critical">🚨 Critical Priority</option>
            </select>

            <input
              className="form-input"
              type="date"
              value={newRecord.scheduled_date}
              onChange={(e) => setNewRecord({...newRecord, scheduled_date: e.target.value})}
              required
            />

            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder="Estimated Cost (₹)"
              value={newRecord.estimated_cost}
              onChange={(e) => setNewRecord({...newRecord, estimated_cost: e.target.value})}
            />

            <input
              className="form-input"
              type="text"
              placeholder="Service Provider"
              value={newRecord.service_provider}
              onChange={(e) => setNewRecord({...newRecord, service_provider: e.target.value})}
            />

            <textarea
              className="form-textarea"
              placeholder="Description/Notes"
              value={newRecord.description}
              onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
              rows={3}
            />

            <button type="submit" className="btn-submit">
              <span className="btn-icon">✓</span>
              <span className="btn-text">Schedule Service</span>
            </button>
          </form>
        </div>
      )}

      {/* Results */}
      <div className="results-info">
        <h3>Maintenance Records</h3>
        <span>Showing {filteredRecords.length} of {records.length} records</span>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3>No maintenance records</h3>
          <p>Schedule maintenance for your fleet vehicles</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Type</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Cost</th>
                <th>Provider</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <tr key={record.id} className="data-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>{record.truck_id || '—'}</td>
                  <td>
                    <div className="maintenance-type">
                      {record.maintenance_type.replace('_', ' ')}
                    </div>
                  </td>
                  <td>{new Date(record.scheduled_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${record.status}`}>
                      {record.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${record.priority}`}>
                      {record.priority === 'low' && '⬇️ '}
                      {record.priority === 'normal' && '➡️ '}
                      {record.priority === 'high' && '⬆️ '}
                      {record.priority === 'critical' && '🚨 '}
                      {record.priority}
                    </span>
                  </td>
                  <td>
                    {record.actual_cost 
                      ? `₹${record.actual_cost.toFixed(2)}` 
                      : record.estimated_cost 
                        ? `~₹${record.estimated_cost.toFixed(2)}` 
                        : '—'
                    }
                  </td>
                  <td>{record.service_provider || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
