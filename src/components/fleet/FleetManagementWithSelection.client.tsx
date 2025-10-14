"use client";
import { useState } from 'react';
import TruckSelectionModal from './TruckSelectionModal.client';
import FleetManagementClient from './FleetManagement.client';

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

type FleetManagementWithSelectionProps = {
  trucks: Truck[];
};

export default function FleetManagementWithSelection({ trucks }: FleetManagementWithSelectionProps) {
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showModal, setShowModal] = useState(true);

  const handleSelectTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowModal(false);
  };

  const handleBackToSelection = () => {
    setShowModal(true);
    setSelectedTruck(null);
  };

  if (showModal) {
    return (
      <TruckSelectionModal
        trucks={trucks}
        onSelectTruck={handleSelectTruck}
      />
    );
  }

  return (
    <div className="fleet-with-selection">
      {/* Breadcrumb / Navigation */}
      <div className="fleet-nav-bar">
        <button 
          className="btn-back-to-trucks"
          onClick={handleBackToSelection}
        >
          ← Back to Truck Selection
        </button>
        
        {selectedTruck && (
          <div className="selected-truck-info">
            <div className="selected-truck-icon">🚛</div>
            <div className="selected-truck-details">
              <div className="selected-truck-code">{selectedTruck.display_code}</div>
              <div className="selected-truck-plate">{selectedTruck.plate}</div>
            </div>
            {selectedTruck.vehicle_type && (
              <div className="selected-truck-type-badge">
                {selectedTruck.vehicle_type}
              </div>
            )}
            <div className={`selected-truck-status status-${selectedTruck.status.toLowerCase()}`}>
              {selectedTruck.status}
            </div>
          </div>
        )}
      </div>

      {/* Fleet Management Component */}
      <FleetManagementClient selectedTruck={selectedTruck} />
    </div>
  );
}
