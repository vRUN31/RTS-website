"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import './TruckStatusManager.css';

interface TruckStatus {
  id: string;
  display_code: string;
  plate: string;
  status: string;
  vehicle_type?: string | null;
  location?: string | null;
  status_updated_at?: string | null;
  odometer_reading?: number | null;
  last_maintenance_date?: string | null;
  next_maintenance_due?: string | null;
}

interface StatusHistory {
  id: string;
  truck_id: string;
  status: string;
  previous_status: string | null;
  reason: string | null;
  notes: string | null;
  location: string | null;
  changed_at: string;
  changed_by: string | null;
}

interface StatusSummary {
  status: string;
  truck_count: number;
  avg_duration_hours: number | null;
}

export default function TruckStatusManager() {
  const [trucks, setTrucks] = useState<TruckStatus[]>([]);
  const [selectedTrucks, setSelectedTrucks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTruckHistory, setSelectedTruckHistory] = useState<StatusHistory[]>([]);
  const [selectedTruckInfo, setSelectedTruckInfo] = useState<TruckStatus | null>(null);
  const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { value: 'running', label: 'Running', icon: '🚚', color: '#10b981' },
    { value: 'halt', label: 'Halt', icon: '⏸️', color: '#f59e0b' },
    { value: 'maintenance', label: 'Maintenance', icon: '🔧', color: '#ef4444' },
    { value: 'offline', label: 'Offline', icon: '⚫', color: '#6b7280' },
    { value: 'available', label: 'Available', icon: '✅', color: '#3b82f6' },
  ];

  useEffect(() => {
    loadTrucks();
    loadStatusSummary();
  }, []);

  async function loadTrucks() {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('trucks')
        .select('id, display_code, plate, status, vehicle_type, location, status_updated_at, odometer_reading, last_maintenance_date, next_maintenance_due')
        .order('display_code', { ascending: true });

      if (error) throw error;
      setTrucks(data || []);
    } catch (error: any) {
      console.error('Error loading trucks:', error);
      alert('Failed to load trucks: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStatusSummary() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_truck_status_summary', { days_back: 30 });
      
      if (error) throw error;
      setStatusSummary(data || []);
    } catch (error: any) {
      console.error('Error loading status summary:', error);
    }
  }

  async function handleBulkStatusUpdate() {
    if (selectedTrucks.size === 0) {
      alert('Please select at least one truck');
      return;
    }

    if (!bulkStatus) {
      alert('Please select a status');
      return;
    }

    if (!confirm(`Update status to "${bulkStatus}" for ${selectedTrucks.size} truck(s)?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const updates = Array.from(selectedTrucks).map(truckId => ({
        id: truckId,
        status: bulkStatus,
        status_updated_at: new Date().toISOString(),
        status_updated_by: user?.id,
        status_reason: bulkReason || `Bulk update to ${bulkStatus}`,
      }));

      // Update each truck
      for (const update of updates) {
        const { error } = await supabase
          .from('trucks')
          .update({
            status: update.status,
            status_updated_at: update.status_updated_at,
            status_updated_by: update.status_updated_by,
            status_reason: update.status_reason,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      alert(`Successfully updated ${selectedTrucks.size} truck(s)`);
      setSelectedTrucks(new Set());
      setBulkStatus('');
      setBulkReason('');
      await loadTrucks();
      await loadStatusSummary();
    } catch (error: any) {
      console.error('Error bulk updating:', error);
      alert('Failed to update trucks: ' + error.message);
    }
  }

  async function handleStatusChange(truckId: string, newStatus: string) {
    const reason = prompt(`Enter reason for changing status to "${newStatus}":`);
    if (reason === null) return; // User cancelled

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('trucks')
        .update({
          status: newStatus,
          status_updated_at: new Date().toISOString(),
          status_updated_by: user?.id,
          status_reason: reason || `Status changed to ${newStatus}`,
        })
        .eq('id', truckId);

      if (error) throw error;

      await loadTrucks();
      await loadStatusSummary();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    }
  }

  async function viewStatusHistory(truck: TruckStatus) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('truck_status_history')
        .select('*')
        .eq('truck_id', truck.id)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSelectedTruckHistory(data || []);
      setSelectedTruckInfo(truck);
      setShowHistoryModal(true);
    } catch (error: any) {
      console.error('Error loading history:', error);
      alert('Failed to load history: ' + error.message);
    }
  }

  function toggleTruckSelection(truckId: string) {
    const newSelection = new Set(selectedTrucks);
    if (newSelection.has(truckId)) {
      newSelection.delete(truckId);
    } else {
      newSelection.add(truckId);
    }
    setSelectedTrucks(newSelection);
  }

  function selectAll() {
    setSelectedTrucks(new Set(filteredTrucks.map(t => t.id)));
  }

  function deselectAll() {
    setSelectedTrucks(new Set());
  }

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = 
      truck.display_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.vehicle_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return (
      <span 
        className="status-badge-advanced"
        style={{ backgroundColor: option?.color || '#6b7280' }}
      >
        <span className="status-icon">{option?.icon || '❓'}</span>
        <span className="status-label">{option?.label || status}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading truck status data...</p>
      </div>
    );
  }

  return (
    <div className="truck-status-manager">
      <div className="header-section">
        <h1>🚛 Advanced Truck Status Management</h1>
        <p>Rich status model with bulk updates and history tracking</p>
      </div>

      {/* Status Summary Cards */}
      <div className="status-summary-grid">
        <div className="summary-card total">
          <div className="summary-icon">🚚</div>
          <div className="summary-content">
            <div className="summary-value">{trucks.length}</div>
            <div className="summary-label">Total Trucks</div>
          </div>
        </div>

        {statusOptions.map(option => {
          const count = trucks.filter(t => t.status === option.value).length;
          const percentage = trucks.length > 0 ? ((count / trucks.length) * 100).toFixed(0) : 0;
          const summary = statusSummary.find(s => s.status === option.value);
          
          return (
            <div key={option.value} className="summary-card" style={{ borderColor: option.color }}>
              <div className="summary-icon">{option.icon}</div>
              <div className="summary-content">
                <div className="summary-value">{count}</div>
                <div className="summary-label">{option.label}</div>
                <div className="summary-meta">{percentage}% of fleet</div>
                {summary?.avg_duration_hours && (
                  <div className="summary-meta">Avg: {summary.avg_duration_hours.toFixed(1)}h</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions-section">
        <div className="bulk-header">
          <h2>📦 Bulk Status Update</h2>
          <div className="selection-controls">
            <button onClick={selectAll} className="btn-select">Select All ({filteredTrucks.length})</button>
            <button onClick={deselectAll} className="btn-select">Deselect All</button>
            <span className="selection-count">
              {selectedTrucks.size} truck{selectedTrucks.size !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        <div className="bulk-form">
          <div className="form-group">
            <label>New Status</label>
            <select 
              value={bulkStatus} 
              onChange={(e) => setBulkStatus(e.target.value)}
              className="form-control"
            >
              <option value="">Select Status...</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <input
              type="text"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="e.g., Scheduled maintenance, Fleet inspection..."
              className="form-control"
            />
          </div>

          <button 
            onClick={handleBulkStatusUpdate}
            disabled={selectedTrucks.size === 0 || !bulkStatus}
            className="btn-primary"
          >
            Update {selectedTrucks.size} Truck{selectedTrucks.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by code, plate, or vehicle type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-filter">
          <label>Filter by Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trucks Table */}
      <div className="trucks-table-container">
        <table className="trucks-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedTrucks.size === filteredTrucks.length && filteredTrucks.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                />
              </th>
              <th>Truck Code</th>
              <th>Plate</th>
              <th>Vehicle Type</th>
              <th>Current Status</th>
              <th>Location</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrucks.map(truck => (
              <tr key={truck.id} className={selectedTrucks.has(truck.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTrucks.has(truck.id)}
                    onChange={() => toggleTruckSelection(truck.id)}
                  />
                </td>
                <td className="code-cell">{truck.display_code}</td>
                <td className="plate-cell">{truck.plate}</td>
                <td>
                  {truck.vehicle_type ? (
                    <span className="vehicle-badge">{truck.vehicle_type}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>{getStatusBadge(truck.status)}</td>
                <td className="location-cell">{truck.location || '—'}</td>
                <td className="date-cell">
                  {truck.status_updated_at 
                    ? new Date(truck.status_updated_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—'
                  }
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <div className="dropdown">
                      <button className="btn-action">Change Status ▼</button>
                      <div className="dropdown-menu">
                        {statusOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleStatusChange(truck.id, option.value)}
                            className="dropdown-item"
                            disabled={truck.status === option.value}
                          >
                            <span className="option-icon">{option.icon}</span>
                            <span className="option-label">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => viewStatusHistory(truck)}
                      className="btn-history"
                      title="View Status History"
                    >
                      📋 History
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTrucks.length === 0 && (
          <div className="empty-state">
            <p>No trucks found matching your filters</p>
          </div>
        )}
      </div>

      {/* Status History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Status History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="btn-close">×</button>
            </div>

            <div className="modal-truck-info">
              <div><strong>Truck:</strong> {selectedTruckInfo?.display_code}</div>
              <div><strong>Plate:</strong> {selectedTruckInfo?.plate}</div>
              <div><strong>Current Status:</strong> {getStatusBadge(selectedTruckInfo?.status || '')}</div>
            </div>

            <div className="history-timeline">
              {selectedTruckHistory.length === 0 ? (
                <div className="empty-history">
                  <p>No status change history available</p>
                </div>
              ) : (
                selectedTruckHistory.map((entry, index) => (
                  <div key={entry.id} className="history-entry">
                    <div className="history-marker">
                      <div className="marker-dot"></div>
                      {index < selectedTruckHistory.length - 1 && <div className="marker-line"></div>}
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <div className="status-change">
                          {entry.previous_status && getStatusBadge(entry.previous_status)}
                          {entry.previous_status && <span className="arrow">→</span>}
                          {getStatusBadge(entry.status)}
                        </div>
                        <div className="history-date">
                          {new Date(entry.changed_at).toLocaleString('en-IN')}
                        </div>
                      </div>
                      {entry.reason && (
                        <div className="history-reason">
                          <strong>Reason:</strong> {entry.reason}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="history-notes">
                          <strong>Notes:</strong> {entry.notes}
                        </div>
                      )}
                      {entry.location && (
                        <div className="history-location">
                          <strong>Location:</strong> {entry.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowHistoryModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
