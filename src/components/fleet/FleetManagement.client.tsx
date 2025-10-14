"use client";
import { useState } from 'react';
import './fleet-management.css';
import TripHistoryClient from './TripHistory.client';
import MaintenanceClient from './Maintenance.client';
import DriverSalaryClient from './DriverSalary.client';
import FuelTrackingClient from './FuelTracking.client';
import RouteOptimizationClient from './RouteOptimization.client';

type TabType = 'trips' | 'maintenance' | 'drivers' | 'fuel' | 'routes';

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

type FleetManagementClientProps = {
  selectedTruck?: Truck | null;
};

export default function FleetManagementClient({ selectedTruck }: FleetManagementClientProps = {}) {
  const [activeTab, setActiveTab] = useState<TabType>('trips');

  const tabs = [
    { id: 'trips' as TabType, label: 'Trip History', icon: '🚛' },
    { id: 'maintenance' as TabType, label: 'Maintenance', icon: '🔧' },
    { id: 'drivers' as TabType, label: 'Driver Salary', icon: '�' },
    { id: 'fuel' as TabType, label: 'Fuel Tracking', icon: '⛽' },
    { id: 'routes' as TabType, label: 'Route Optimization', icon: '🗺️' },
  ];

  return (
    <div className="fleet-management-container">
      <div className="fleet-header">
        <h1 className="fleet-title">
          Fleet Management
          {selectedTruck && (
            <span className="fleet-truck-label">
              {' '}- {selectedTruck.display_code} ({selectedTruck.plate})
            </span>
          )}
        </h1>
        <p className="fleet-subtitle">
          {selectedTruck 
            ? `Viewing detailed information for ${selectedTruck.display_code}`
            : 'Comprehensive vehicle and driver management system'
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="fleet-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`fleet-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'trips' && <TripHistoryClient truckId={selectedTruck?.id} />}
        {activeTab === 'maintenance' && <MaintenanceClient />}
        {activeTab === 'drivers' && <DriverSalaryClient truckId={selectedTruck?.id} driverId={selectedTruck?.driver_id} />}
        {activeTab === 'fuel' && <FuelTrackingClient />}
        {activeTab === 'routes' && <RouteOptimizationClient />}
      </div>
    </div>
  );
}
