"use client";
import React, { useEffect, useState } from "react";
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="manage-trucks-container">
      <h2>Add New Truck</h2>
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
        <select name="status" value={newTruck.status} onChange={handleInputChange}>
          <option value="Running">Running</option>
          <option value="Halt">Halt</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <button type="submit" className="btn-dark">Add Truck</button>
      </form>

      <h2>Existing Trucks</h2>
      <div className="table-responsive">
        <table className="truck-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Plate</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Location</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map(truck => (
              <tr key={truck.id}>
                <td>{truck.display_code ?? truck.id}</td>
                <td>{truck.plate}</td>
                <td>{truck.status}</td>
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
                  <button 
                    onClick={() => handleRemoveTruck(truck.id)}
                    className="btn-danger"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}