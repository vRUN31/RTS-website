"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type MapBookingViewComponent from './MapBookingView';
import { calculatePrice, formatPrice, type PriceBreakdown } from '@/src/utils/pricing';
import VehicleRecommendation from './VehicleRecommendation.client';

// Dynamically import the map component (client-only)
const MapBookingView = dynamic<React.ComponentProps<typeof MapBookingViewComponent>>(
  () => import('./MapBookingView'),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        background: 'var(--card, #fff)',
        borderRadius: '12px',
        border: '1px solid var(--border, #e5e5e5)'
      }}>
        <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
        <p>Loading map...</p>
      </div>
    ),
  }
);

interface LocationData {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: [number, number][]; // [lng, lat] pairs
}

interface EnhancedBookingFormProps {
  form: {
    source_city: string;
    destination_city: string;
    vehicle_type: string;
    material: string;
    weight_mt: string;
    pickup_date: string;
    notes: string;
  };
  setForm: (form: any) => void;
  placing: boolean;
  placeError: string | null;
  placeSuccess: string | null;
  onCancel: () => void;
  // Callback to pass route data back to parent
  onRouteCalculated?: (distance: number, duration: number) => void;
}

export default function EnhancedBookingForm({
  form,
  setForm,
  placing,
  placeError,
  placeSuccess,
  onCancel,
  onRouteCalculated
}: EnhancedBookingFormProps) {
  const [useMapMode, setUseMapMode] = useState(false);
  const [sourceLocation, setSourceLocation] = useState<LocationData | null>(null);
  const [destLocation, setDestLocation] = useState<LocationData | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<PriceBreakdown | null>(null);

  // Calculate price when route and vehicle type change
  useEffect(() => {
    if (route && form.vehicle_type) {
      const distanceInKm = route.distance / 1000;
      const price = calculatePrice(distanceInKm, form.vehicle_type);
      setPriceEstimate(price);
    } else {
      setPriceEstimate(null);
    }
  }, [route, form.vehicle_type]);

  // Update text fields when locations are selected
  useEffect(() => {
    if (sourceLocation && sourceLocation.address) {
      const city = sourceLocation.address.city || 
                   sourceLocation.address.town || 
                   sourceLocation.address.village || 
                   sourceLocation.display_name.split(',')[0];
      setForm({ ...form, source_city: city });
    }
  }, [sourceLocation]);

  useEffect(() => {
    if (destLocation && destLocation.address) {
      const city = destLocation.address.city || 
                   destLocation.address.town || 
                   destLocation.address.village || 
                   destLocation.display_name.split(',')[0];
      setForm({ ...form, destination_city: city });
    }
  }, [destLocation]);

  // Fetch route when both locations are set
  useEffect(() => {
    if (sourceLocation && destLocation) {
      fetchRoute();
    } else {
      setRoute(null);
    }
  }, [sourceLocation, destLocation]);

  const fetchRoute = async () => {
    if (!sourceLocation || !destLocation) return;

    try {
      setMapError(null);
      const url = `https://router.project-osrm.org/route/v1/driving/${sourceLocation.lon},${sourceLocation.lat};${destLocation.lon},${destLocation.lat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const routeData = data.routes[0];
        const newRoute = {
          distance: routeData.distance,
          duration: routeData.duration,
          geometry: routeData.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]]),
        };
        setRoute(newRoute);
        
        // Pass route data back to parent component
        if (onRouteCalculated) {
          onRouteCalculated(newRoute.distance / 1000, newRoute.duration); // distance in km, duration in seconds
        }
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Route fetch error:', error);
      setMapError('Could not calculate route. Please check your locations.');
      setRoute(null);
      
      // Clear route data in parent
      if (onRouteCalculated) {
        onRouteCalculated(0, 0);
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Mode Toggle */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        background: 'var(--card-light, #f8f9fa)',
        borderRadius: '8px',
        border: '1px solid var(--border, #e5e5e5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.938rem', fontWeight: 600 }}>
            {useMapMode ? '🗺️ Map Mode' : '📝 Text Mode'}
          </span>
          <span style={{ fontSize: '0.813rem', color: 'var(--text-dim, #666)' }}>
            {useMapMode ? 'Select locations on map' : 'Type city names'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setUseMapMode(!useMapMode)}
          style={{
            padding: '6px 12px',
            background: 'var(--brand, #ff4d00)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 77, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {useMapMode ? 'Switch to Text' : 'Switch to Map'}
        </button>
      </div>

      {/* Form Fields Container (not a form tag - parent handles that) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {/* Map View (when enabled) */}
        {useMapMode && (
          <div style={{ marginBottom: '16px' }}>
            <MapBookingView
              sourceLocation={sourceLocation}
              destLocation={destLocation}
              route={route}
              onSourceSelect={setSourceLocation}
              onDestSelect={setDestLocation}
              mapError={mapError}
              setMapError={setMapError}
            />
            
            {/* Distance & Duration Display */}
            {route && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                border: '2px solid #4caf50',
                borderRadius: '8px',
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600 }}>DISTANCE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1b5e20' }}>
                    {(route.distance / 1000).toFixed(1)} km
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600 }}>EST. TIME</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1b5e20' }}>
                    {Math.round(route.duration / 60)} min
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Always show text inputs (fallback and manual override) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input 
            className="filter-input" 
            placeholder="Source City (e.g., Mumbai)" 
            value={form.source_city} 
            onChange={(e) => setForm({ ...form, source_city: e.target.value })} 
            aria-label="Source City"
            required
            style={{ opacity: useMapMode && sourceLocation ? 0.7 : 1 }}
          />
          <input 
            className="filter-input" 
            placeholder="Destination City (e.g., Delhi)" 
            value={form.destination_city} 
            onChange={(e) => setForm({ ...form, destination_city: e.target.value })} 
            aria-label="Destination City"
            required
            style={{ opacity: useMapMode && destLocation ? 0.7 : 1 }}
          />
        </div>

        {/* Vehicle Recommendation System */}
        <VehicleRecommendation 
          weight={parseFloat(form.weight_mt) || 0}
          sourceCity={form.source_city}
          destCity={form.destination_city}
          material={form.material}
          onVehicleSelect={(vehicleType) => setForm({ ...form, vehicle_type: vehicleType })}
          selectedVehicle={form.vehicle_type}
        />

        {/* Manual override dropdown (shown after selection or for manual input) */}
        {form.vehicle_type && (
          <details style={{ marginTop: '8px' }}>
            <summary style={{
              padding: '10px',
              background: '#f5f5f5',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#616161',
              fontWeight: 600
            }}>
              🔧 Manual Override / Change Vehicle
            </summary>
            <select 
              className="filter-input" 
              aria-label="Vehicle Type" 
              value={form.vehicle_type} 
              onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} 
              required
              style={{ marginTop: '8px' }}
            >
              <option value="">Select Vehicle Type</option>
              <option value="Pickup (1.5T)">Pickup (1.5T)</option>
              <option value="LCV (3.5T)">LCV (3.5T)</option>
              <option value="Truck (9T)">Truck (9T)</option>
              <option value="Truck (16T)">Truck (16T)</option>
              <option value="Trailer (25T)">Trailer (25T)</option>
            </select>
          </details>
        )}

        {/* Price Estimation Display */}
        {priceEstimate && (
          <div style={{
            marginTop: '8px',
            padding: '16px',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            border: '2px solid #ff9800',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#e65100',
              fontWeight: 600,
              marginBottom: '12px',
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}>
              💰 ESTIMATED PRICE BREAKDOWN
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Base Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ffcc80' }}>
                <span style={{ fontSize: '0.875rem', color: '#e65100' }}>
                  Base Price ({priceEstimate.distance} km × ₹{priceEstimate.perKm}/km)
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e65100' }}>
                  {formatPrice(priceEstimate.basePrice)}
                </span>
              </div>

              {/* GST */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ffcc80' }}>
                <span style={{ fontSize: '0.875rem', color: '#e65100' }}>GST (18%)</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e65100' }}>
                  {formatPrice(priceEstimate.gst)}
                </span>
              </div>

              {/* Toll */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ffcc80' }}>
                <span style={{ fontSize: '0.875rem', color: '#e65100' }}>Toll Charges (Est.)</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e65100' }}>
                  {formatPrice(priceEstimate.toll)}
                </span>
              </div>

              {/* Loading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '2px solid #ff9800' }}>
                <span style={{ fontSize: '0.875rem', color: '#e65100' }}>Loading/Unloading</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e65100' }}>
                  {formatPrice(priceEstimate.loading)}
                </span>
              </div>

              {/* Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0 0',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#bf360c' }}>
                  TOTAL AMOUNT
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#bf360c' }}>
                  {formatPrice(priceEstimate.total)}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#e65100',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              ℹ️ This is an estimated price. Final charges may vary based on actual route, tolls, and other factors.
            </div>
          </div>
        )}

        {/* Show prompt to select vehicle if route exists but no vehicle selected */}
        {route && !form.vehicle_type && (
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: '2px solid #2196f3',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#0d47a1',
            textAlign: 'center'
          }}>
            👆 <strong>Select a vehicle type</strong> above to see the estimated price
          </div>
        )}

        <input 
          className="filter-input" 
          placeholder="Material" 
          value={form.material} 
          onChange={(e) => setForm({ ...form, material: e.target.value })} 
          aria-label="Material" 
        />

        <input 
          className="filter-input" 
          placeholder="Weight (MT)" 
          type="number" 
          step="0.01" 
          value={form.weight_mt} 
          onChange={(e) => setForm({ ...form, weight_mt: e.target.value })} 
          aria-label="Weight (MT)" 
        />

        <input 
          className="filter-input" 
          placeholder="Pickup Date" 
          type="date" 
          value={form.pickup_date} 
          onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} 
          aria-label="Pickup Date" 
        />

        <input 
          className="filter-input" 
          placeholder="Notes (optional)" 
          value={form.notes} 
          onChange={(e) => setForm({ ...form, notes: e.target.value })} 
          aria-label="Notes" 
        />

        <div className="row-gap-12" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-dark" 
            type="submit" 
            disabled={placing}
            style={{
              flex: 1,
              background: placing ? '#ccc' : 'linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%)',
              cursor: placing ? 'not-allowed' : 'pointer'
            }}
          >
            {placing ? '⏳ Submitting…' : '✅ Submit Booking'}
          </button>
          <button 
            className="btn-dark" 
            type="button" 
            onClick={onCancel}
            style={{ flex: 0.5 }}
          >
            Cancel
          </button>
        </div>

        {placeError && (
          <div role="alert" style={{
            padding: '12px',
            background: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: '6px',
            color: '#c62828',
            fontSize: '0.938rem'
          }}>
            ❌ {placeError}
          </div>
        )}

        {placeSuccess && (
          <div role="status" style={{
            padding: '12px',
            background: '#e8f5e9',
            border: '1px solid #66bb6a',
            borderRadius: '6px',
            color: '#2e7d32',
            fontSize: '0.938rem'
          }}>
            ✅ {placeSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
