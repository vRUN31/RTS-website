"use client";
import React, { useEffect, useState, useMemo } from "react";
import { createClient } from '@/utils/supabase/client';

type Truck = { 
  id: string; 
  display_code: string; 
  plate: string; 
  status: string; 
  location?: string | null; 
  driver_id?: string | null; 
  driver?: { 
    id: string; 
    name?: string | null; 
    phone?: string | null; 
  } | null 
};

export default function ManageTrucksClient() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [newTruck, setNewTruck] = useState({ 
    display_code: "", 
    plate: "", 
    status: "Running", 
    driver_name: "", 
    driver_email: "", 
    driver_phone: "", 
    location: "" 
  });
  const [loading, setLoading] = useState(true);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    driver_name: "",
    driver_phone: "",
    driver_email: "",
    location: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"code" | "status" | "location">("code");

  useEffect(() => {
    let mounted = true;
    loadTrucks();
    return () => { mounted = false; };

    async function loadTrucks() {
      const supabase = createClient();
      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate, status, location, driver_id')
        .order('created_at', { ascending: false })
        .limit(1000);

      const rows = (trucksData ?? []) as any[];
      const driverIds = Array.from(new Set(rows.map(r => r.driver_id).filter(Boolean)));
      let driverMap: Record<string, any> = {};
      
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, name, phone, license_no')
          .in('id', driverIds);
        driverMap = Object.fromEntries((drivers ?? []).map((d: any) => [d.id, d]));
      }

      const annotated = rows.map(r => ({
        ...r,
        driver: r.driver_id ? driverMap[r.driver_id] ?? null : null,
      }));

      if (mounted) {
        setTrucks(annotated as Truck[]);
        setLoading(false);
      }
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setNewTruck({ ...newTruck, [e.target.name]: e.target.value });
  }

  async function handleAddTruck(e: React.FormEvent) {
    e.preventDefault();
    if (!newTruck.display_code || !newTruck.plate || !newTruck.location) {
      alert('Please fill in all required fields: Truck Code, Plate Number, and Location');
      return;
    }

    const supabase = createClient();
    let driverId: string | null = null;

    // Create driver if info provided
    if (newTruck.driver_name) {
      try {
        const response = await fetch('/api/drivers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            name: newTruck.driver_name,
            phone: newTruck.driver_phone || null,
            email: newTruck.driver_email || null
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          let errorMessage;
          try {
            const jsonError = JSON.parse(errorData);
            errorMessage = jsonError.error || 'Unknown error occurred';
          } catch {
            errorMessage = errorData || response.statusText || 'Failed to create driver';
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data.id) {
          throw new Error('No driver ID returned');
        }
        
        driverId = data.id;
      } catch (e: any) {
        console.error('Driver creation error:', e);
        alert(e?.message || 'Failed to create driver');
        return;
      }
    }

    // Create truck
    try {
      const { error: truckError } = await supabase
        .from('trucks')
        .insert({
          display_code: newTruck.display_code,
          plate: newTruck.plate,
          status: newTruck.status.toLowerCase(),
          location: newTruck.location,
          driver_id: driverId,
          created_at: new Date().toISOString()
        });

      if (truckError) {
        console.error('Truck creation error:', truckError);
        alert('Failed to create truck: ' + truckError.message);
        return;
      }

      // Reset form and reload trucks
      setNewTruck({ 
        display_code: "", 
        plate: "", 
        status: "Running", 
        driver_name: "", 
        driver_email: "", 
        driver_phone: "", 
        location: "" 
      });
      
      // Reload the trucks list
      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate, status, location, driver_id')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (trucksData) {
        const rows = trucksData as any[];
        const driverIds = Array.from(new Set(rows.map(r => r.driver_id).filter(Boolean)));
        let driverMap: Record<string, any> = {};
        
        if (driverIds.length > 0) {
          const { data: drivers } = await supabase
            .from('drivers')
            .select('id, name, phone')
            .in('id', driverIds);
          driverMap = Object.fromEntries((drivers ?? []).map((d: any) => [d.id, d]));
        }

        setTrucks(rows.map(r => ({
          ...r,
          driver: r.driver_id ? driverMap[r.driver_id] ?? null : null,
        })));
      }
    } catch (e: any) {
      console.error('Truck creation error:', e);
      alert('Failed to create truck: ' + (e?.message || 'Unknown error'));
    }
  }

  async function handleRemoveTruck(id: string) {
    if (!confirm('Are you sure you want to remove this truck?')) return;
    
    const supabase = createClient();
    const { error } = await supabase.from('trucks').delete().eq('id', id);
    if (error) {
      console.error('Truck deletion error:', error);
      alert(error.message);
      return;
    }
    setTrucks(trucks.filter(t => t.id !== id));
  }

  function handleEditClick(truck: Truck) {
    setEditingTruck(truck);
    setEditForm({
      status: truck.status,
      driver_name: truck.driver?.name || "",
      driver_phone: truck.driver?.phone || "",
      driver_email: "",
      location: truck.location || ""
    });
  }

  function handleEditFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleUpdateTruck(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTruck) return;

    const supabase = createClient();
    let driverId = editingTruck.driver_id;

    // Update or create driver if info changed
    if (editForm.driver_name && (!editingTruck.driver || editForm.driver_name !== editingTruck.driver.name || editForm.driver_phone !== editingTruck.driver.phone)) {
      try {
        const response = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            name: editForm.driver_name,
            phone: editForm.driver_phone || null,
            email: editForm.driver_email || null
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          let errorMessage;
          try {
            const jsonError = JSON.parse(errorData);
            errorMessage = jsonError.error || 'Unknown error occurred';
          } catch {
            errorMessage = errorData || response.statusText || 'Failed to update driver';
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!data.id) throw new Error('No driver ID returned');
        driverId = data.id;
      } catch (e: any) {
        console.error('Driver update error:', e);
        alert(e?.message || 'Failed to update driver');
        return;
      }
    }

    // Update truck
    try {
      const { error: truckError } = await supabase
        .from('trucks')
        .update({
          status: editForm.status.toLowerCase(),
          location: editForm.location,
          driver_id: driverId,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTruck.id);

      if (truckError) throw truckError;

      // Reload the trucks list
      const { data: trucksData } = await supabase
        .from('trucks')
        .select('id, display_code, plate, status, location, driver_id')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (trucksData) {
        const rows = trucksData as any[];
        const driverIds = Array.from(new Set(rows.map(r => r.driver_id).filter(Boolean)));
        let driverMap: Record<string, any> = {};
        
        if (driverIds.length > 0) {
          const { data: drivers } = await supabase
            .from('drivers')
            .select('id, name, phone')
            .in('id', driverIds);
          driverMap = Object.fromEntries((drivers ?? []).map((d: any) => [d.id, d]));
        }

        setTrucks(rows.map(r => ({
          ...r,
          driver: r.driver_id ? driverMap[r.driver_id] ?? null : null,
        })));
      }

      setEditingTruck(null);
      setEditForm({
        status: "",
        driver_name: "",
        driver_phone: "",
        driver_email: "",
        location: ""
      });
    } catch (e: any) {
      console.error('Truck update error:', e);
      alert('Failed to update truck: ' + (e?.message || 'Unknown error'));
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const statusCount: Record<string, number> = {};
    trucks.forEach(t => {
      const status = t.status.toLowerCase();
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return {
      total: trucks.length,
      running: statusCount['running'] || 0,
      halt: statusCount['halt'] || 0,
      maintenance: statusCount['maintenance'] || 0,
      withDriver: trucks.filter(t => t.driver_id).length,
      withoutDriver: trucks.filter(t => !t.driver_id).length,
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
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "code") return a.display_code.localeCompare(b.display_code);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "location") return (a.location || "").localeCompare(b.location || "");
      return 0;
    });

    return filtered;
  }, [trucks, searchQuery, statusFilter, sortBy]);

  if (loading) return <div className="loading-spinner">Loading trucks...</div>;

  return (
    <div className="manage-trucks-container">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-total">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Trucks</div>
          </div>
        </div>
        <div className="stat-card stat-card-running">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.running}</div>
            <div className="stat-label">Running</div>
          </div>
        </div>
        <div className="stat-card stat-card-halt">
          <div className="stat-icon">⏸</div>
          <div className="stat-content">
            <div className="stat-value">{stats.halt}</div>
            <div className="stat-label">Halted</div>
          </div>
        </div>
        <div className="stat-card stat-card-maintenance">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{stats.maintenance}</div>
            <div className="stat-label">Maintenance</div>
          </div>
        </div>
        <div className="stat-card stat-card-drivers">
          <div className="stat-icon">👨‍✈️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.withDriver}</div>
            <div className="stat-label">With Driver</div>
          </div>
        </div>
        <div className="stat-card stat-card-no-drivers">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.withoutDriver}</div>
            <div className="stat-label">No Driver</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <button 
          className="btn-add-truck"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '− Close Form' : '+ Add New Truck'}
        </button>
        
        <div className="search-filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by code, plate, driver, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="halt">Halt</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="code">Sort by Code</option>
            <option value="status">Sort by Status</option>
            <option value="location">Sort by Location</option>
          </select>
        </div>
      </div>

      {/* Add Truck Form (collapsible) */}
      {showAddForm && (
        <div className="add-form-container">
          <h3>Add New Truck</h3>
          <form className="truck-form" onSubmit={handleAddTruck}>
        <input
          name="display_code"
          value={newTruck.display_code}
          onChange={handleInputChange}
          placeholder="Truck Code (e.g. TRK100)"
          required
        />
        <input
          name="plate"
          value={newTruck.plate}
          onChange={handleInputChange}
          placeholder="Plate Number"
          required
        />
        <input
          name="driver_name"
          value={newTruck.driver_name}
          onChange={handleInputChange}
          placeholder="Driver Name"
        />
        <input
          name="driver_phone"
          value={newTruck.driver_phone}
          onChange={handleInputChange}
          placeholder="Driver Phone"
        />
        <input
          name="driver_email"
          value={newTruck.driver_email}
          onChange={handleInputChange}
          placeholder="Driver Email"
        />
        <input
          name="location"
          value={newTruck.location}
          onChange={handleInputChange}
          placeholder="Location"
          required
        />
        <select name="status" value={newTruck.status} onChange={handleInputChange} className="status-select">
          <option value="Running">✓ Running - Operational</option>
          <option value="Halt">⏸ Halt - Temporarily Stopped</option>
          <option value="Maintenance">🔧 Maintenance - Under Service</option>
        </select>
        <button type="submit" className="btn-submit-truck">
          <span className="btn-icon">➕</span>
          <span className="btn-text">Add Truck</span>
        </button>
      </form>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        <h2>Fleet Overview</h2>
        <span className="results-count">
          Showing {filteredTrucks.length} of {trucks.length} trucks
        </span>
      </div>
      {editingTruck && (
        <div className="edit-form-overlay">
          <div className="edit-form-container">
            <h3>✏️ Edit Truck: {editingTruck.display_code}</h3>
            <form className="truck-form" onSubmit={handleUpdateTruck}>
              <select name="status" value={editForm.status} onChange={handleEditFormChange} className="status-select">
                <option value="running">✓ Running - Operational</option>
                <option value="halt">⏸ Halt - Temporarily Stopped</option>
                <option value="maintenance">🔧 Maintenance - Under Service</option>
              </select>
              <input
                name="driver_name"
                value={editForm.driver_name}
                onChange={handleEditFormChange}
                placeholder="Driver Name"
              />
              <input
                name="driver_phone"
                value={editForm.driver_phone}
                onChange={handleEditFormChange}
                placeholder="Driver Phone"
              />
              <input
                name="driver_email"
                value={editForm.driver_email}
                onChange={handleEditFormChange}
                placeholder="Driver Email"
              />
              <input
                name="location"
                value={editForm.location}
                onChange={handleEditFormChange}
                placeholder="Location"
              />
              <div className="edit-form-buttons">
                <button type="submit" className="btn-success">
                  <span className="btn-icon">💾</span>
                  <span className="btn-text">Save Changes</span>
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingTruck(null)}>
                  <span className="btn-icon">✖</span>
                  <span className="btn-text">Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredTrucks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <h3>No trucks found</h3>
          <p>{searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "Add your first truck to get started"}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="truck-table">
            <thead>
              <tr>
                <th>Truck Code</th>
                <th>Plate</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrucks.map((truck, index) => (
              <tr key={truck.id}>
                <td>{truck.display_code ?? truck.id}</td>
                <td>{truck.plate}</td>
                <td>
                  <span className={`status-badge status-${truck.status}`}>
                    {truck.status}
                  </span>
                </td>
                <td>
                  {truck.driver 
                    ? `${truck.driver.name || 'Unknown'} ${truck.driver.phone ? `(${truck.driver.phone})` : ''}`
                    : truck.driver_id 
                      ? `ID: ${truck.driver_id.slice(0,8)}…`
                      : '—'
                  }
                </td>
                <td>{truck.location || '—'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEditClick(truck)}
                      className="btn-edit"
                      title="Edit truck details"
                    >
                      <span className="btn-icon">✏️</span>
                      <span className="btn-text">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleRemoveTruck(truck.id)}
                      className="btn-delete"
                      title="Delete truck permanently"
                    >
                      <span className="btn-icon">🗑️</span>
                      <span className="btn-text">Delete</span>
                    </button>
                  </div>
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