"use client";
import React, { useState, useMemo } from 'react';

type Truck = {
  id: string;
  display_code: string;
  plate: string;
  status: string;
  vehicle_type?: string | null;
  location?: string | null;
  driver_id?: string | null;
  driver?: {
    id: string;
    name?: string | null;
    phone?: string | null;
  } | null;
};

type TruckSelectionModalProps = {
  trucks: Truck[];
  onSelectTruck: (truck: Truck) => void;
  onClose?: () => void;
};

export default function TruckSelectionModal({ trucks, onSelectTruck, onClose }: TruckSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"code" | "status" | "location" | "type">("code");

  // Statistics
  const stats = useMemo(() => {
    const statusCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    
    trucks.forEach(t => {
      const status = t.status.toLowerCase();
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      if (t.vehicle_type) {
        typeCount[t.vehicle_type] = (typeCount[t.vehicle_type] || 0) + 1;
      }
    });
    
    return {
      total: trucks.length,
      running: statusCount['running'] || 0,
      halt: statusCount['halt'] || 0,
      maintenance: statusCount['maintenance'] || 0,
      offline: statusCount['offline'] || 0,
      withDriver: trucks.filter(t => t.driver_id).length,
      typeBreakdown: typeCount,
    };
  }, [trucks]);

  // Filtered and sorted trucks
  const filteredTrucks = useMemo(() => {
    let filtered = trucks.filter(truck => {
      const matchesSearch = 
        truck.display_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.driver?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || truck.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesType = vehicleTypeFilter === "all" || truck.vehicle_type === vehicleTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "code") return a.display_code.localeCompare(b.display_code);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "location") return (a.location || "").localeCompare(b.location || "");
      if (sortBy === "type") return (a.vehicle_type || "").localeCompare(b.vehicle_type || "");
      return 0;
    });

    return filtered;
  }, [trucks, searchQuery, statusFilter, vehicleTypeFilter, sortBy]);

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'running') return '🟢';
    if (s === 'halt') return '🟡';
    if (s === 'maintenance') return '🔧';
    if (s === 'offline') return '🔴';
    return '⚪';
  };

  // Get vehicle icon
  const getVehicleIcon = (type: string | null | undefined) => {
    if (!type) return '🚛';
    if (type.includes('Pickup')) return '🚐';
    if (type.includes('LCV')) return '🚙';
    if (type.includes('9T')) return '🚚';
    if (type.includes('16T')) return '🚛';
    if (type.includes('Trailer') || type.includes('25T')) return '🚜';
    return '🚛';
  };

  return (
    <div className="truck-selection-overlay">
      <div className="truck-selection-modal">
        {/* Header */}
        <div className="truck-selection-header">
          <div className="header-content">
            <h1 className="modal-title">🚛 Select a Truck</h1>
            <p className="modal-subtitle">Choose a truck to view detailed fleet management information</p>
          </div>
          {onClose && (
            <button className="btn-close-modal" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        {/* Statistics Dashboard */}
        <div className="truck-stats-grid">
          <div className="truck-stat-card stat-total">
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Fleet</div>
            </div>
          </div>
          <div className="truck-stat-card stat-running">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-value">{stats.running}</div>
              <div className="stat-label">Running</div>
            </div>
          </div>
          <div className="truck-stat-card stat-halt">
            <div className="stat-icon">🟡</div>
            <div className="stat-content">
              <div className="stat-value">{stats.halt}</div>
              <div className="stat-label">Halted</div>
            </div>
          </div>
          <div className="truck-stat-card stat-maintenance">
            <div className="stat-icon">🔧</div>
            <div className="stat-content">
              <div className="stat-value">{stats.maintenance}</div>
              <div className="stat-label">Maintenance</div>
            </div>
          </div>
          <div className="truck-stat-card stat-drivers">
            <div className="stat-icon">👨‍✈️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.withDriver}</div>
              <div className="stat-label">With Driver</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="truck-filters-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="truck-search-input"
              placeholder="Search by code, plate, driver, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select 
              className="truck-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="running">🟢 Running</option>
              <option value="halt">🟡 Halt</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="offline">🔴 Offline</option>
            </select>

            <select 
              className="truck-filter-select"
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
            >
              <option value="all">All Vehicle Types</option>
              <option value="Pickup (1.5T)">🚐 Pickup (1.5T)</option>
              <option value="LCV (3.5T)">🚙 LCV (3.5T)</option>
              <option value="Truck (9T)">🚚 Truck (9T)</option>
              <option value="Truck (16T)">🚛 Truck (16T)</option>
              <option value="Trailer (25T)">🚜 Trailer (25T)</option>
            </select>

            <select 
              className="truck-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="code">Sort: Code</option>
              <option value="status">Sort: Status</option>
              <option value="type">Sort: Vehicle Type</option>
              <option value="location">Sort: Location</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count-bar">
          <span className="results-text">
            Showing <strong>{filteredTrucks.length}</strong> of <strong>{trucks.length}</strong> trucks
          </span>
          {(searchQuery || statusFilter !== "all" || vehicleTypeFilter !== "all") && (
            <button 
              className="btn-clear-filters"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setVehicleTypeFilter("all");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Trucks Grid */}
        <div className="trucks-grid-container">
          {filteredTrucks.length === 0 ? (
            <div className="empty-trucks-state">
              <div className="empty-icon">🚛</div>
              <h3>No trucks found</h3>
              <p>
                {searchQuery || statusFilter !== "all" || vehicleTypeFilter !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "No trucks available in the fleet"}
              </p>
            </div>
          ) : (
            <div className="trucks-grid">
              {filteredTrucks.map((truck) => (
                <div
                  key={truck.id}
                  className={`truck-card truck-status-${truck.status.toLowerCase()}`}
                  onClick={() => onSelectTruck(truck)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTruck(truck);
                    }
                  }}
                >
                  {/* Status Badge */}
                  <div className={`truck-status-badge status-${truck.status.toLowerCase()}`}>
                    <span className="status-icon">{getStatusIcon(truck.status)}</span>
                    <span className="status-text">{truck.status}</span>
                  </div>

                  {/* Vehicle Icon */}
                  <div className="truck-icon-wrapper">
                    <div className="truck-icon">{getVehicleIcon(truck.vehicle_type)}</div>
                  </div>

                  {/* Truck Info */}
                  <div className="truck-info">
                    <h3 className="truck-code">{truck.display_code}</h3>
                    <div className="truck-plate">{truck.plate}</div>
                    
                    {truck.vehicle_type && (
                      <div className="truck-type">
                        <span className="info-label">Type:</span>
                        <span className="info-value">{truck.vehicle_type}</span>
                      </div>
                    )}

                    {truck.location && (
                      <div className="truck-location">
                        <span className="location-icon">📍</span>
                        <span className="location-text">{truck.location}</span>
                      </div>
                    )}

                    {truck.driver ? (
                      <div className="truck-driver">
                        <span className="driver-icon">👨‍✈️</span>
                        <span className="driver-text">
                          {truck.driver.name || 'Driver assigned'}
                          {truck.driver.phone && (
                            <span className="driver-phone"> • {truck.driver.phone}</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="truck-no-driver">
                        <span className="warning-icon">⚠️</span>
                        <span className="warning-text">No driver assigned</span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <button className="btn-view-truck">
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
