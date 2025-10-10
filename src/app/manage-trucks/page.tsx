"use client";
import React, { useEffect, useState } from "react";
import './manage-trucks.css';
import { createClient } from '@/utils/supabase/client';
import { redirect } from 'next/navigation';

type Truck = { id: string; display_code: string; plate: string; status: string; location?: string | null; driver_id?: string | null; driver?: { id: string; name?: string | null; phone?: string | null } | null };

export default function ManageTrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [newTruck, setNewTruck] = useState({ display_code: "", plate: "", status: "Running", driver_name: "", driver_email: "", driver_phone: "", location: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
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
        const { data: drivers } = await supabase.from('drivers').select('id, name, phone, license_no, license_expiry').in('id', driverIds);
        driverMap = Object.fromEntries((drivers ?? []).map((d: any) => [d.id, d]));
      }

      const annotated = rows.map(r => ({
        ...r,
        driver: r.driver_id ? driverMap[r.driver_id] ?? null : null,
      }));

      if (mounted) setTrucks(annotated as any[]);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setNewTruck({ ...newTruck, [e.target.name]: e.target.value });
  }

  async function handleAddTruck(e: React.FormEvent) {
    e.preventDefault();
    // Use user-provided `id` as text. Ensure required fields present.
    if (!newTruck.display_code || !newTruck.plate || !newTruck.location) {
      alert('Please fill in all required fields: Truck Code, Plate Number, and Location');
      return;
    }
    const supabase = createClient();
    // Create driver first (if provided)
    let driverId: string | null = null;
    if (newTruck.driver_name || newTruck.driver_email || newTruck.driver_phone) {
      try {
        const resp = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            name: newTruck.driver_name || 'Unknown', 
            phone: newTruck.driver_phone || null, 
            email: newTruck.driver_email || null 
          }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          try {
            const j = JSON.parse(text);
            alert('Failed to create driver: ' + (j?.error || 'Unknown error'));
          } catch (e) {
            alert('Failed to create driver: ' + (text.slice(0, 100) || resp.statusText));
          }
          return;
        }
        const j = await resp.json();
        if (!j?.id) {
          alert('Failed to create driver: No ID returned');
          return;
        }
        driverId = j.id;
      } catch (e: any) {
        alert('Failed to create driver: ' + (e?.message ?? 'unknown'));
        return;
      }
    }
    const payload = {
      display_code: newTruck.display_code,
      plate: newTruck.plate,
      status: newTruck.status.toLowerCase(),
      location: newTruck.location,
      driver_id: driverId,
    } as any;
    const { error } = await supabase.from('trucks').insert(payload);
    if (error) { alert(error.message); return; }
    // re-fetch and annotate with driver names
    const { data } = await supabase.from('trucks').select('id, display_code, plate, status, location, driver_id').order('created_at', { ascending: false }).limit(1000);
    const rows = (data ?? []) as any[];
    const driverIds = Array.from(new Set(rows.map(r => r.driver_id).filter(Boolean)));
    let driverMap: Record<string, any> = {};
    if (driverIds.length > 0) {
      const { data: drivers } = await supabase.from('drivers').select('id, name, phone').in('id', driverIds);
      driverMap = Object.fromEntries((drivers ?? []).map((d: any) => [d.id, d]));
    }
    const annotated = rows.map(r => ({ ...r, driver: r.driver_id ? driverMap[r.driver_id] ?? null : null }));
    setTrucks(annotated as any[]);
    setNewTruck({ display_code: "", plate: "", status: "Running", driver_name: "", driver_email: "", driver_phone: "", location: "" });
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
  <input name="display_code" value={newTruck.display_code} onChange={handleInputChange} placeholder="Truck Code (e.g. TRK100)" required />
        <input name="plate" value={newTruck.plate} onChange={handleInputChange} placeholder="Plate Number" required />
  <input name="driver_name" value={newTruck.driver_name} onChange={handleInputChange} placeholder="Driver Name" required />
  <input name="driver_email" value={newTruck.driver_email} onChange={handleInputChange} placeholder="Driver Email" />
  <input name="driver_phone" value={newTruck.driver_phone} onChange={handleInputChange} placeholder="Driver Phone" />
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
              <td>{(truck as any).display_code ?? truck.id}</td>
              <td>{truck.plate}</td>
              <td>{truck.status}</td>
              <td>{truck.driver ? `${truck.driver.name || 'Unknown'} (${truck.driver.phone || 'No phone'})` : truck.driver_id ? `ID: ${truck.driver_id.slice(0,8)}…` : '—'}</td>
              <td>{truck.location}</td>
              <td><button onClick={() => handleRemoveTruck(truck.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
