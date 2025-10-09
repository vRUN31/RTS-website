"use client";
import React, { useState } from "react";
import './manage-trucks.css';

const initialTrucks = [
  { id: "TRK001", plate: "MH12AB1234", status: "Running", driver: "Amit Kumar", location: "Pune" },
  { id: "TRK002", plate: "MH14CD5678", status: "Halt", driver: "Sunil Singh", location: "Mumbai" },
];

export default function ManageTrucksPage() {
  const [trucks, setTrucks] = useState(initialTrucks);
  const [newTruck, setNewTruck] = useState({ id: "", plate: "", status: "Running", driver: "", location: "" });

  function handleInputChange(e) {
    setNewTruck({ ...newTruck, [e.target.name]: e.target.value });
  }

  function handleAddTruck(e) {
    e.preventDefault();
    if (!newTruck.id || !newTruck.plate || !newTruck.driver || !newTruck.location) return;
    setTrucks([...trucks, newTruck]);
    setNewTruck({ id: "", plate: "", status: "Running", driver: "", location: "" });
  }

  function handleRemoveTruck(id) {
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
              <td>{truck.driver}</td>
              <td>{truck.location}</td>
              <td><button onClick={() => handleRemoveTruck(truck.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
