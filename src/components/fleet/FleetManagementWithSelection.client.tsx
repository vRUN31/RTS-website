"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleSelectTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowModal(false);
  };

  const handleBackToSelection = () => {
    setShowModal(true);
    setSelectedTruck(null);
  };

  const handleAdvancedStatus = () => {
    router.push('/admin/fleet/status');
  };

  if (showModal) {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem 2rem',
          background: 'white',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>Fleet Management</h1>
          <button
            onClick={handleAdvancedStatus}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ff4d00 0%, #ff7033 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 77, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 77, 0, 0.3)';
            }}
          >
            🚛 Advanced Truck Status
          </button>
        </div>
        <TruckSelectionModal
          trucks={trucks}
          onSelectTruck={handleSelectTruck}
        />
      </div>
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
