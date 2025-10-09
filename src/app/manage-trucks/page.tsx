"use client";
import React, { useEffect, useState } from "react";
import './manage-trucks.css';
import { createClient } from '@/utils/supabase/client';

type Truck = { id: string; plate: string; status: string; location?: string | null; driver_id?: string | null };

export default function ManageTrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [newTruck, setNewTruck] = useState({ id: "", plate: "", status: "Running", driver: "", location: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('trucks')
        .select('id, plate, status, location, driver_id')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (mounted) setTrucks((data as any) ?? []);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setNewTruck({ ...newTruck, [e.target.name]: e.target.value });
  }

  async function handleAddTruck(e: React.FormEvent) {
    e.preventDefault();
    if (!newTruck.id || !newTruck.plate || !newTruck.location) return;
    const supabase = createClient();
    const payload = {
      id: newTruck.id,
      plate: newTruck.plate,
      status: newTruck.status.toLowerCase(),
      location: newTruck.location,
    } as any;
    const { error } = await supabase.from('trucks').insert(payload);
    if (error) { alert(error.message); return; }
    const { data } = await supabase.from('trucks').select('id, plate, status, location, driver_id').order('created_at', { ascending: false }).limit(1000);
    setTrucks((data as any) ?? []);
    setNewTruck({ id: "", plate: "", status: "Running", driver: "", location: "" });
  }

  async function handleRemoveTruck(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('trucks').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setTrucks(trucks.filter(t => t.id !== id));
  }

  return (
    <main className="manage-trucks-main">
      <h1>Manage Trucks</h1>
      <form className="truck-form" onSubmit={handleAddTruck}>
        <input name="id" value={newTruck.id} onChange={handleInputChange} placeholder="Truck ID" required />
        <input name="plate" value={newTruck.plate} onChange={handleInputChange} placeholder="Plate Number" required />
        <input name="driver" value={newTruck.driver} onChange={handleInputChange} placeholder="Driver Name" required />
        <input name="location" value={newTruck.location} onChange={handleInputChange} placeholder="Location" required />
        <select name="status" value={newTruck.status} onChange={handleInputChange}>
          <option value="Running">Running</option>
          <option value="Halt">Halt</option>
        </select>
        <button type="submit">Add Truck</button>
      </form>
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
              <td>{truck.id}</td>
              <td>{truck.plate}</td>
              <td>{truck.status}</td>
              <td>{truck.driver_id ? truck.driver_id.slice(0,8) + '…' : '—'}</td>
              <td>{truck.location}</td>
              <td><button onClick={() => handleRemoveTruck(truck.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
