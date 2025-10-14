"use client";
import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminPricingSettings({
  userId,
  initialConfig,
  onSaveStatus,
}: {
  userId: string;
  initialConfig: any;
  onSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}) {
  const getConfigValue = (key: string, defaultValue: any) => {
    const config = initialConfig?.find((c: any) => c.config_key === key);
    return config ? JSON.parse(config.config_value) : defaultValue;
  };

  const [fuelPrice, setFuelPrice] = useState(getConfigValue('fuel_price_per_liter', 105));
  const [gstPercent, setGstPercent] = useState(getConfigValue('gst_percentage', 18));
  const [tollPercent, setTollPercent] = useState(getConfigValue('toll_percentage', 5));
  const [loadingCharges, setLoadingCharges] = useState(getConfigValue('loading_charges', 500));
  const [timeBuffer, setTimeBuffer] = useState(getConfigValue('time_buffer_percentage', 20));
  
  const [vehicleRates, setVehicleRates] = useState(
    getConfigValue('vehicle_rates', {})
  );

  const [saving, setSaving] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    onSaveStatus('saving');

    try {
      const supabase = createClient();

      // Update each configuration
      await Promise.all([
        supabase.from('system_config')
          .update({ 
            config_value: JSON.stringify(fuelPrice),
            updated_by: userId 
          })
          .eq('config_key', 'fuel_price_per_liter'),
        
        supabase.from('system_config')
          .update({ 
            config_value: JSON.stringify(gstPercent),
            updated_by: userId 
          })
          .eq('config_key', 'gst_percentage'),
        
        supabase.from('system_config')
          .update({ 
            config_value: JSON.stringify(tollPercent),
            updated_by: userId 
          })
          .eq('config_key', 'toll_percentage'),
        
        supabase.from('system_config')
          .update({ 
            config_value: JSON.stringify(loadingCharges),
            updated_by: userId 
          })
          .eq('config_key', 'loading_charges'),
        
        supabase.from('system_config')
          .update({ 
            config_value: JSON.stringify(timeBuffer),
            updated_by: userId 
          })
          .eq('config_key', 'time_buffer_percentage'),
        
        supabase.from('system_config')
          .update({ 
            config_value: JSON.stringify(vehicleRates),
            updated_by: userId 
          })
          .eq('config_key', 'vehicle_rates'),
      ]);

      onSaveStatus('saved');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Save pricing config error:', error);
      onSaveStatus('error');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }

  function updateVehicleRate(vehicleType: string, field: string, value: number) {
    setVehicleRates((prev: any) => ({
      ...prev,
      [vehicleType]: {
        ...prev[vehicleType],
        [field]: value,
      },
    }));
  }

  const vehicleTypes = Object.keys(vehicleRates);

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2 className="section-title">💰 Pricing Configuration</h2>
        <p className="section-description">
          <span className="admin-badge">Admin Only</span>
          Manage system-wide pricing and operational costs
        </p>
      </div>

      <div className="alert alert-warning mb-20">
        <span className="alert-icon">⚠️</span>
        <div>
          <strong>Important:</strong> Changes here affect profit calculations and customer pricing.
          Review carefully before saving.
        </div>
      </div>

      <div className="settings-grid">
        {/* General Pricing */}
        <div className="settings-card">
          <h3 className="card-title">⛽ Operational Costs</h3>
          
          <div className="form-group">
            <label className="form-label">
              Fuel Price per Liter (₹)
              <span className="label-info">Used in profit calculations</span>
            </label>
            <input
              type="number"
              className="form-input"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              min="50"
              max="200"
              step="0.5"
            />
            <p className="form-help">Current diesel price per liter in INR</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Time Buffer Percentage (%)
              <span className="label-info">For ETA calculations</span>
            </label>
            <input
              type="number"
              className="form-input"
              value={timeBuffer}
              onChange={(e) => setTimeBuffer(Number(e.target.value))}
              min="0"
              max="50"
              step="5"
            />
            <p className="form-help">Buffer added to driving time (e.g., 20% = 1.2x base time)</p>
          </div>
        </div>

        {/* Customer Pricing */}
        <div className="settings-card">
          <h3 className="card-title">💵 Customer Pricing</h3>
          
          <div className="form-group">
            <label className="form-label">
              GST Percentage (%)
              <span className="label-required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              value={gstPercent}
              onChange={(e) => setGstPercent(Number(e.target.value))}
              min="0"
              max="28"
              step="1"
            />
            <p className="form-help">Goods and Services Tax rate</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Toll Percentage (%)
              <span className="label-required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              value={tollPercent}
              onChange={(e) => setTollPercent(Number(e.target.value))}
              min="0"
              max="15"
              step="0.5"
            />
            <p className="form-help">Estimated toll as % of base price</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Loading/Unloading Charges (₹)
              <span className="label-required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              value={loadingCharges}
              onChange={(e) => setLoadingCharges(Number(e.target.value))}
              min="0"
              max="5000"
              step="50"
            />
            <p className="form-help">Fixed charges for loading and unloading</p>
          </div>
        </div>
      </div>

      {/* Vehicle Rates */}
      <div className="settings-card mt-20">
        <h3 className="card-title">🚛 Vehicle Rates & Operational Data</h3>
        <p className="card-description">
          Configure pricing and operational costs for each vehicle type
        </p>

        <div className="vehicle-rates-grid">
          {vehicleTypes.map((vehicleType) => {
            const rates = vehicleRates[vehicleType];
            const isActive = activeVehicle === vehicleType;

            return (
              <div key={vehicleType} className="vehicle-rate-card">
                <div 
                  className="vehicle-rate-header"
                  onClick={() => setActiveVehicle(isActive ? null : vehicleType)}
                >
                  <div className="vehicle-name">
                    <span className="vehicle-icon">🚚</span>
                    {vehicleType}
                  </div>
                  <button className="expand-btn">
                    {isActive ? '−' : '+'}
                  </button>
                </div>

                {isActive && (
                  <div className="vehicle-rate-body">
                    <div className="rate-grid">
                      <div className="rate-field">
                        <label className="rate-label">Base Rate (₹/km)</label>
                        <input
                          type="number"
                          className="rate-input"
                          value={rates.baseRate}
                          onChange={(e) => updateVehicleRate(vehicleType, 'baseRate', Number(e.target.value))}
                          min="1"
                          step="1"
                        />
                      </div>

                      <div className="rate-field">
                        <label className="rate-label">Minimum Charge (₹)</label>
                        <input
                          type="number"
                          className="rate-input"
                          value={rates.minimumCharge}
                          onChange={(e) => updateVehicleRate(vehicleType, 'minimumCharge', Number(e.target.value))}
                          min="100"
                          step="100"
                        />
                      </div>

                      <div className="rate-field">
                        <label className="rate-label">Fuel Efficiency (km/L)</label>
                        <input
                          type="number"
                          className="rate-input"
                          value={rates.fuelEfficiency}
                          onChange={(e) => updateVehicleRate(vehicleType, 'fuelEfficiency', Number(e.target.value))}
                          min="1"
                          step="0.5"
                        />
                      </div>

                      <div className="rate-field">
                        <label className="rate-label">Driver Cost (₹/day)</label>
                        <input
                          type="number"
                          className="rate-input"
                          value={rates.driverCostPerDay}
                          onChange={(e) => updateVehicleRate(vehicleType, 'driverCostPerDay', Number(e.target.value))}
                          min="500"
                          step="100"
                        />
                      </div>

                      <div className="rate-field">
                        <label className="rate-label">Maintenance (₹/km)</label>
                        <input
                          type="number"
                          className="rate-input"
                          value={rates.maintenanceCostPerKm}
                          onChange={(e) => updateVehicleRate(vehicleType, 'maintenanceCostPerKm', Number(e.target.value))}
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn-primary btn-large"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Pricing Configuration'}
        </button>
        <p className="settings-help">
          💡 Tip: Test with a sample booking after changing rates to verify calculations
        </p>
      </div>
    </div>
  );
}
