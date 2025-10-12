"use client";
import { useState } from 'react';
import './fleet-management.css';
import TripHistoryClient from './TripHistory.client';
import MaintenanceClient from './Maintenance.client';
import DriverPerformanceClient from './DriverPerformance.client';
import FuelTrackingClient from './FuelTracking.client';
import RouteOptimizationClient from './RouteOptimization.client';

type TabType = 'trips' | 'maintenance' | 'drivers' | 'fuel' | 'routes';

export default function FleetManagementClient() {
  const [activeTab, setActiveTab] = useState<TabType>('trips');

  const tabs = [
    { id: 'trips' as TabType, label: 'Trip History', icon: '🚛' },
    { id: 'maintenance' as TabType, label: 'Maintenance', icon: '🔧' },
    { id: 'drivers' as TabType, label: 'Driver Performance', icon: '👨‍✈️' },
    { id: 'fuel' as TabType, label: 'Fuel Tracking', icon: '⛽' },
    { id: 'routes' as TabType, label: 'Route Optimization', icon: '🗺️' },
  ];

  return (
    <div className="fleet-management-container">
      <div className="fleet-header">
        <h1 className="fleet-title">Fleet Management</h1>
        <p className="fleet-subtitle">Comprehensive vehicle and driver management system</p>
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
        {activeTab === 'trips' && <TripHistoryClient />}
        {activeTab === 'maintenance' && <MaintenanceClient />}
        {activeTab === 'drivers' && <DriverPerformanceClient />}
        {activeTab === 'fuel' && <FuelTrackingClient />}
        {activeTab === 'routes' && <RouteOptimizationClient />}
      </div>
    </div>
  );
}
